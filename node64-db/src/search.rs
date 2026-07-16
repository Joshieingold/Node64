use rusqlite::{params_from_iter, Connection, types::Value as SqlValue};

use crate::chess::san::parse_san;
use crate::chess::{Board, START_FEN};
use crate::models::{GameStats, GameSummary, SearchFilters, SearchResult};
use crate::zobrist::{hash_board, hash_to_i64};

/// Build and run a search query against the currently open database.
pub fn search_games(conn: &Connection, filters: &SearchFilters) -> Result<SearchResult, String> {
    let (where_clause, args) = build_where(conn, filters)?;

    let sort_col = match filters.sort_by.as_deref() {
        Some("white") => "g.white",
        Some("black") => "g.black",
        Some("elo") => "COALESCE(g.white_elo,0) + COALESCE(g.black_elo,0)",
        _ => "g.date",
    };
    let sort_dir = if filters.sort_desc.unwrap_or(true) { "DESC" } else { "ASC" };

    let limit = filters.limit.unwrap_or(200).min(2000);
    let offset = filters.offset.unwrap_or(0).max(0);

    let count_sql = format!("SELECT COUNT(*) FROM games g {where_clause}");
    let total_count: i64 = conn
        .query_row(&count_sql, params_from_iter(args.iter()), |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let sql = format!(
        "SELECT g.id, g.uuid, g.white, g.black, g.result, g.date, g.event, g.eco, g.opening_name,
                g.white_elo, g.black_elo, g.ply_count
         FROM games g
         {where_clause}
         ORDER BY {sort_col} {sort_dir}
         LIMIT {limit} OFFSET {offset}"
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let games = stmt
        .query_map(params_from_iter(args.iter()), |row| {
            Ok(GameSummary {
                id: row.get(0)?,
                uuid: row.get(1)?,
                white: row.get(2)?,
                black: row.get(3)?,
                result: row.get(4)?,
                date: row.get(5)?,
                event: row.get(6)?,
                eco: row.get(7)?,
                opening_name: row.get(8)?,
                white_elo: row.get(9)?,
                black_elo: row.get(10)?,
                ply_count: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(SearchResult { games, total_count })
}

/// Build a WHERE clause + bound parameters from the filter set.
/// Position/move-sequence filters join through game_positions.
fn build_where(conn: &Connection, filters: &SearchFilters) -> Result<(String, Vec<SqlValue>), String> {
    let mut clauses: Vec<String> = Vec::new();
    let mut args: Vec<SqlValue> = Vec::new();

    if let Some(p) = &filters.player {
        clauses.push("(g.white LIKE ?  OR g.black LIKE ?)".to_string());
        let pat = format!("%{p}%");
        args.push(SqlValue::Text(pat.clone()));
        args.push(SqlValue::Text(pat));
    }
    if let Some(w) = &filters.white {
        clauses.push("g.white LIKE ?".to_string());
        args.push(SqlValue::Text(format!("%{w}%")));
    }
    if let Some(b) = &filters.black {
        clauses.push("g.black LIKE ?".to_string());
        args.push(SqlValue::Text(format!("%{b}%")));
    }
    if let Some(eco) = &filters.eco {
        clauses.push("g.eco = ?".to_string());
        args.push(SqlValue::Text(eco.clone()));
    }
    if let Some(result) = &filters.result {
        clauses.push("g.result = ?".to_string());
        args.push(SqlValue::Text(result.clone()));
    }
    if let Some(event) = &filters.event {
        clauses.push("g.event LIKE ?".to_string());
        args.push(SqlValue::Text(format!("%{event}%")));
    }
    if let Some(from) = &filters.date_from {
        clauses.push("g.date >= ?".to_string());
        args.push(SqlValue::Text(from.clone()));
    }
    if let Some(to) = &filters.date_to {
        clauses.push("g.date <= ?".to_string());
        args.push(SqlValue::Text(to.clone()));
    }
    if let Some(min_elo) = filters.min_elo {
        clauses.push("(COALESCE(g.white_elo,0) >= ? AND COALESCE(g.black_elo,0) >= ?)".to_string());
        args.push(SqlValue::Integer(min_elo));
        args.push(SqlValue::Integer(min_elo));
    }

    // Exact position search: resolve FEN -> zobrist hash -> position_id,
    // then require the game to have reached that position at some ply.
    if let Some(fen) = &filters.fen {
        let board = Board::from_fen(fen).map_err(|e| format!("bad FEN: {e}"))?;
        let hash = hash_to_i64(hash_board(&board));
        clauses.push(
            "g.id IN (SELECT gp.game_id FROM game_positions gp JOIN positions p ON p.id = gp.position_id WHERE p.zobrist_hash = ?)"
                .to_string(),
        );
        args.push(SqlValue::Integer(hash));
    }

    // Move sequence search: replay the given SAN sequence from the
    // standard start position, resolve the final position's hash, and
    // require games to have reached that exact position at that exact ply.
    if let Some(seq) = &filters.move_sequence {
        let sans = extract_sans_from_sequence(seq);
        if !sans.is_empty() {
            let mut board = Board::from_fen(START_FEN).map_err(|e| e.to_string())?;
            for san in &sans {
                let mv = parse_san(&board, san)?;
                board = board.apply(&mv);
            }
            let hash = hash_to_i64(hash_board(&board));
            let ply = sans.len() as i64;
            clauses.push(
                "g.id IN (SELECT gp.game_id FROM game_positions gp JOIN positions p ON p.id = gp.position_id WHERE p.zobrist_hash = ? AND gp.ply = ?)"
                    .to_string(),
            );
            args.push(SqlValue::Integer(hash));
            args.push(SqlValue::Integer(ply));
        }
    }

    let _ = conn; // reserved for future opening-name lookups
    let where_clause = if clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", clauses.join(" AND "))
    };
    Ok((where_clause, args))
}

/// Parse "1.e4 c6 2.d4 d5" / "e4 c6 d4 d5" into a flat SAN token list.
fn extract_sans_from_sequence(seq: &str) -> Vec<String> {
    seq.split_whitespace()
        .filter_map(|tok| {
            let stripped: String = tok.trim_start_matches(|c: char| c.is_ascii_digit() || c == '.').to_string();
            if stripped.is_empty() { None } else { Some(stripped) }
        })
        .collect()
}

/// Aggregate statistics over a filtered result set.
pub fn compute_stats(conn: &Connection, filters: &SearchFilters) -> Result<GameStats, String> {
    let (where_clause, args) = build_where(conn, filters)?;

    let sql = format!(
        "SELECT
            COUNT(*),
            SUM(CASE WHEN g.result = '1-0' THEN 1 ELSE 0 END),
            SUM(CASE WHEN g.result = '0-1' THEN 1 ELSE 0 END),
            SUM(CASE WHEN g.result = '1/2-1/2' THEN 1 ELSE 0 END),
            AVG(g.white_elo),
            AVG(g.black_elo),
            AVG(CAST(SUBSTR(g.date,1,4) AS INTEGER))
         FROM games g {where_clause}"
    );

    conn.query_row(&sql, params_from_iter(args.iter()), |row| {
        let total: i64 = row.get(0)?;
        let white_wins: i64 = row.get::<_, Option<i64>>(1)?.unwrap_or(0);
        let black_wins: i64 = row.get::<_, Option<i64>>(2)?.unwrap_or(0);
        let draws: i64 = row.get::<_, Option<i64>>(3)?.unwrap_or(0);
        let other = total - white_wins - black_wins - draws;
        let pct = |n: i64| if total > 0 { n as f64 / total as f64 * 100.0 } else { 0.0 };
        Ok(GameStats {
            total_games: total,
            white_wins,
            black_wins,
            draws,
            other,
            white_win_pct: pct(white_wins),
            black_win_pct: pct(black_wins),
            draw_pct: pct(draws),
            avg_white_elo: row.get(4)?,
            avg_black_elo: row.get(5)?,
            avg_year: row.get(6)?,
        })
    })
    .map_err(|e| e.to_string())
}

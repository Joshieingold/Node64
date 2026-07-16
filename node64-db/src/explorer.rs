use rusqlite::{params, Connection};

use crate::chess::san::parse_san;
use crate::chess::{Board, START_FEN};
use crate::models::{ExplorerMove, ExplorerResult, GameSummary};
use crate::zobrist::{hash_board, hash_to_i64};

/// Build the opening explorer view for a given position (FEN) or, if none
/// is given, the standard starting position.
pub fn explore(conn: &Connection, fen: Option<&str>) -> Result<ExplorerResult, String> {
    let fen = fen.unwrap_or(START_FEN).to_string();
    let board = Board::from_fen(&fen).map_err(|e| format!("bad FEN: {e}"))?;
    let hash = hash_to_i64(hash_board(&board));

    let position_id: Option<i64> = conn
        .query_row("SELECT id FROM positions WHERE zobrist_hash = ?1", params![hash], |r| r.get(0))
        .ok();

    let Some(position_id) = position_id else {
        return Ok(ExplorerResult { position_fen: fen, total_games: 0, moves: vec![] });
    };

    let mut stmt = conn
        .prepare(
            "SELECT gp.move_san, g.result, g.white_elo, g.black_elo
             FROM game_positions gp
             JOIN games g ON g.id = gp.game_id
             WHERE gp.position_id = ?1 AND gp.move_san IS NOT NULL",
        )
        .map_err(|e| e.to_string())?;

    struct Row {
        san: String,
        result: Option<String>,
        white_elo: Option<i64>,
        black_elo: Option<i64>,
    }

    let rows: Vec<Row> = stmt
        .query_map(params![position_id], |r| {
            Ok(Row {
                san: r.get(0)?,
                result: r.get(1)?,
                white_elo: r.get(2)?,
                black_elo: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    use std::collections::HashMap;
    struct Agg {
        games: i64,
        white_wins: i64,
        black_wins: i64,
        draws: i64,
        rating_sum: i64,
        rating_count: i64,
    }
    let mut by_move: HashMap<String, Agg> = HashMap::new();

    for row in &rows {
        let agg = by_move.entry(row.san.clone()).or_insert(Agg {
            games: 0,
            white_wins: 0,
            black_wins: 0,
            draws: 0,
            rating_sum: 0,
            rating_count: 0,
        });
        agg.games += 1;
        match row.result.as_deref() {
            Some("1-0") => agg.white_wins += 1,
            Some("0-1") => agg.black_wins += 1,
            Some("1/2-1/2") => agg.draws += 1,
            _ => {}
        }
        if let (Some(w), Some(b)) = (row.white_elo, row.black_elo) {
            agg.rating_sum += w + b;
            agg.rating_count += 2;
        }
    }

    let total_games = rows.len() as i64;
    let mut moves: Vec<ExplorerMove> = by_move
        .into_iter()
        .map(|(san, agg)| {
            let score_pct = if agg.games > 0 {
                (agg.white_wins as f64 + 0.5 * agg.draws as f64) / agg.games as f64 * 100.0
            } else {
                0.0
            };
            ExplorerMove {
                san,
                games: agg.games,
                white_wins: agg.white_wins,
                black_wins: agg.black_wins,
                draws: agg.draws,
                avg_rating: if agg.rating_count > 0 {
                    Some(agg.rating_sum as f64 / agg.rating_count as f64)
                } else {
                    None
                },
                score_pct,
            }
        })
        .collect();

    moves.sort_by(|a, b| b.games.cmp(&a.games));

    Ok(ExplorerResult { position_fen: fen, total_games, moves })
}

/// Convenience: explore the position reached after playing `move_sequence`
/// (e.g. "1.e4 c6") from the standard start.
pub fn explore_after_sequence(conn: &Connection, move_sequence: &str) -> Result<ExplorerResult, String> {
    let mut board = Board::from_fen(START_FEN).map_err(|e| e.to_string())?;
    for tok in move_sequence.split_whitespace() {
        let san: String = tok.trim_start_matches(|c: char| c.is_ascii_digit() || c == '.').to_string();
        if san.is_empty() {
            continue;
        }
        let mv = parse_san(&board, &san)?;
        board = board.apply(&mv);
    }
    explore(conn, Some(&board.to_fen()))
}

/// Representative games reaching a given position: earliest, latest, and
/// highest-rated encounters, useful for the explorer's "representative
/// games" panel.
pub fn representative_games(conn: &Connection, fen: &str, limit: i64) -> Result<Vec<GameSummary>, String> {
    let board = Board::from_fen(fen).map_err(|e| format!("bad FEN: {e}"))?;
    let hash = hash_to_i64(hash_board(&board));

    let mut stmt = conn
        .prepare(
            "SELECT g.id, g.uuid, g.white, g.black, g.result, g.date, g.event, g.eco, g.white_elo, g.black_elo, g.ply_count
             FROM games g
             JOIN game_positions gp ON gp.game_id = g.id
             JOIN positions p ON p.id = gp.position_id
             WHERE p.zobrist_hash = ?1
             ORDER BY COALESCE(g.white_elo,0) + COALESCE(g.black_elo,0) DESC
             LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

    let games = stmt
        .query_map(params![hash, limit], |row| {
            Ok(GameSummary {
                id: row.get(0)?,
                uuid: row.get(1)?,
                white: row.get(2)?,
                black: row.get(3)?,
                result: row.get(4)?,
                date: row.get(5)?,
                event: row.get(6)?,
                eco: row.get(7)?,
                white_elo: row.get(8)?,
                black_elo: row.get(9)?,
                ply_count: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(games)
}

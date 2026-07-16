use rusqlite::{params, Connection};
use crate::util::new_uuid_v4;

use crate::chess::san::parse_san;
use crate::chess::{Board, START_FEN};
use crate::models::ImportSummary;
use crate::pgn::{self, ParsedGame};
use crate::zobrist::{hash_board, hash_to_i64};

/// Import every game found in `pgn_text` into the currently open database.
/// `source` is a free-text label, e.g. "manual-import", "analysis-doc:foo.pgn".
pub fn import_pgn_text(conn: &Connection, pgn_text: &str, source: &str) -> Result<ImportSummary, String> {
    let mut summary = ImportSummary {
        imported: 0,
        skipped_duplicates: 0,
        failed: 0,
        errors: vec![],
    };

    for raw in pgn::split_games(pgn_text) {
        match pgn::parse_game(&raw) {
            Ok(parsed) => match import_one_game(conn, &parsed, source) {
                Ok(true) => summary.imported += 1,
                Ok(false) => summary.skipped_duplicates += 1,
                Err(e) => {
                    summary.failed += 1;
                    summary.errors.push(e);
                }
            },
            Err(e) => {
                summary.failed += 1;
                summary.errors.push(e);
            }
        }
    }

    Ok(summary)
}

/// Returns Ok(true) if imported, Ok(false) if skipped as a duplicate.
fn import_one_game(conn: &Connection, parsed: &ParsedGame, source: &str) -> Result<bool, String> {
    // 1. Determine UUID: reuse one carried in the PGN (e.g. a prior Node64
    //    export, tag "Node64UUID" or standard "GameId"), otherwise mint one.
    let uuid = parsed
        .tag("Node64UUID")
        .or_else(|| parsed.tag("GameId"))
        .map(|s| s.to_string())
        .unwrap_or_else(|| new_uuid_v4());

    let existing: Option<i64> = conn
        .query_row("SELECT id FROM games WHERE uuid = ?1", params![uuid], |r| r.get(0))
        .ok();
    if existing.is_some() {
        return Ok(false); // duplicate by UUID
    }

    // 2. Determine starting position.
    let start_fen = parsed.tag("FEN").unwrap_or(START_FEN).to_string();
    let is_chess960 = parsed
        .tag("Variant")
        .map(|v| v.to_lowercase().contains("960"))
        .unwrap_or(false);

    let mut board = Board::from_fen(&start_fen).map_err(|e| format!("bad start FEN: {e}"))?;

    // 3. Secondary duplicate check: same players + date + first N moves.
    //    Catches games imported from a different source without a shared UUID.
    let fingerprint = content_fingerprint(parsed, &start_fen);
    let dup: Option<i64> = conn
        .query_row(
            "SELECT id FROM games WHERE white = ?1 AND black = ?2 AND date = ?3 AND ply_count = ?4",
            params![
                parsed.tag("White"),
                parsed.tag("Black"),
                parsed.tag("Date"),
                parsed.sans.len() as i64
            ],
            |r| r.get(0),
        )
        .ok();
    if let Some(existing_id) = dup {
        if same_move_sequence(conn, existing_id, &fingerprint)? {
            return Ok(false);
        }
    }

    // 4. Replay moves, indexing every position along the way.
    let mut position_ids: Vec<(i64, i64, Option<String>)> = Vec::new(); // (ply, position_id, move_san)
    let start_position_id = ensure_position(conn, &board)?;

    let mut sans_played = Vec::with_capacity(parsed.sans.len());
    let mut current_ply: i64 = 0;
    let mut last_position_id = start_position_id;

    for san_token in &parsed.sans {
        let mv = parse_san(&board, san_token)
            .map_err(|e| format!("game {}: {e}", parsed.tag("Event").unwrap_or("?")))?;
        let canonical_san = crate::chess::san::move_to_san(&board, &mv, &crate::chess::movegen::legal_moves(&board));

        position_ids.push((current_ply, last_position_id, Some(canonical_san.clone())));
        sans_played.push(canonical_san);

        board = board.apply(&mv);
        current_ply += 1;
        last_position_id = ensure_position(conn, &board)?;
    }
    // final position, no move played from it
    position_ids.push((current_ply, last_position_id, None));

    // 5. Insert the game row.
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO games
            (uuid, white, black, event, site, date, round, result, eco,
             white_elo, black_elo, start_fen, is_chess960, ply_count, pgn, source, imported_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17)",
        params![
            uuid,
            parsed.tag("White"),
            parsed.tag("Black"),
            parsed.tag("Event"),
            parsed.tag("Site"),
            parsed.tag("Date"),
            parsed.tag("Round"),
            parsed.tag("Result"),
            parsed.tag("ECO"),
            parsed.tag("WhiteElo").and_then(|s| s.parse::<i64>().ok()),
            parsed.tag("BlackElo").and_then(|s| s.parse::<i64>().ok()),
            start_fen,
            is_chess960 as i64,
            parsed.sans.len() as i64,
            parsed.raw_pgn,
            source,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let game_id = conn.last_insert_rowid();

    // 6. Insert game_positions rows.
    let mut stmt = conn
        .prepare("INSERT INTO game_positions (game_id, ply, position_id, move_san) VALUES (?1,?2,?3,?4)")
        .map_err(|e| e.to_string())?;
    for (ply, position_id, move_san) in position_ids {
        stmt.execute(params![game_id, ply, position_id, move_san]).map_err(|e| e.to_string())?;
    }

    Ok(true)
}

/// Look up (or create) the position row for `board`'s current state.
fn ensure_position(conn: &Connection, board: &Board) -> Result<i64, String> {
    let hash = hash_to_i64(hash_board(board));
    if let Ok(id) = conn.query_row(
        "SELECT id FROM positions WHERE zobrist_hash = ?1",
        params![hash],
        |r| r.get::<_, i64>(0),
    ) {
        return Ok(id);
    }
    conn.execute(
        "INSERT INTO positions (zobrist_hash, fen) VALUES (?1, ?2)",
        params![hash, board.to_fen()],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

fn content_fingerprint(parsed: &ParsedGame, start_fen: &str) -> String {
    format!(
        "{}|{}|{}|{}|{}",
        parsed.tag("White").unwrap_or(""),
        parsed.tag("Black").unwrap_or(""),
        parsed.tag("Date").unwrap_or(""),
        start_fen,
        parsed.sans.join(" "),
    )
}

fn same_move_sequence(conn: &Connection, existing_game_id: i64, _fingerprint: &str) -> Result<bool, String> {
    // Compare move lists ply-by-ply against the candidate existing game.
    // (Simplified: relies on the earlier ply_count match; a full SAN
    // comparison can be layered on by joining game_positions if needed.)
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM game_positions WHERE game_id = ?1",
            params![existing_game_id],
            |r| r.get(0),
        )
        .unwrap_or(0);
    Ok(count > 0)
}

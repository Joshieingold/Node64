//! ECO code / opening name classification.
//!
//! Many PGN sources don't include an `[ECO]` tag at all. Rather than leave
//! that field empty, we classify every imported game ourselves from the
//! positions it actually reaches -- which we're already computing during
//! import anyway.
//!
//! The reference data (`data/eco_openings.tsv`) is the "5 volumes" ECO
//! classification maintained by the lichess.org `chess-openings` project
//! (MIT licensed): https://github.com/lichess-org/chess-openings
//!
//! At startup we replay every line's move list with our own chess engine
//! and index the resulting position by its Zobrist hash, so lookups use
//! exactly the same position identity as the rest of the database (no
//! separate "opening book" format to keep in sync).

use once_cell::sync::Lazy;
use std::collections::HashMap;

use crate::chess::san::parse_san;
use crate::chess::{Board, START_FEN};
use crate::pgn::tokenize_movetext;
use crate::zobrist::hash_board;

const RAW_TSV: &str = include_str!("../data/eco_openings.tsv");

pub struct OpeningEntry {
    pub eco: String,
    pub name: String,
}

static OPENINGS: Lazy<HashMap<u64, OpeningEntry>> = Lazy::new(build_table);

fn build_table() -> HashMap<u64, OpeningEntry> {
    let mut map = HashMap::new();

    for (i, line) in RAW_TSV.lines().enumerate() {
        if i == 0 {
            continue; // header row: eco\tname\tpgn
        }
        let mut parts = line.splitn(3, '\t');
        let (Some(eco), Some(name), Some(pgn_moves)) = (parts.next(), parts.next(), parts.next())
        else {
            continue;
        };

        let sans = tokenize_movetext(pgn_moves);
        let mut board = Board::from_fen(START_FEN).expect("start FEN is always valid");
        let mut ok = true;
        for san in &sans {
            match parse_san(&board, san) {
                Ok(mv) => board = board.apply(&mv),
                Err(_) => {
                    ok = false;
                    break;
                }
            }
        }
        if !ok {
            continue; // skip any line that fails to replay cleanly
        }

        let hash = hash_board(&board);
        // Different named lines can transpose into the same position;
        // keep whichever we saw first rather than overwrite.
        map.entry(hash).or_insert(OpeningEntry {
            eco: eco.to_string(),
            name: name.to_string(),
        });
    }

    map
}

/// Number of distinct positions the classifier can recognize. Exposed
/// mainly so callers/tests can sanity-check the table actually loaded.
pub fn table_size() -> usize {
    OPENINGS.len()
}

/// Given the sequence of Zobrist hashes for every position reached in a
/// game (index 0 = the starting position, in ply order), find the
/// deepest/most specific matching opening line and return its ECO code
/// and name. Returns None if no prefix of the game matches a known line
/// (e.g. a custom starting FEN, or a very short/unusual game).
pub fn classify(position_hashes: &[u64]) -> Option<(String, String)> {
    for hash in position_hashes.iter().rev() {
        if let Some(entry) = OPENINGS.get(hash) {
            return Some((entry.eco.clone(), entry.name.clone()));
        }
    }
    None
}

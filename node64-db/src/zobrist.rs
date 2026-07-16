//! Zobrist hashing.
//!
//! The table is generated deterministically from a fixed seed (SplitMix64)
//! so the same position always produces the same hash across app restarts,
//! app versions, and machines. This is important: the hash is persisted in
//! the database and used as the lookup/dedup key for positions.
//!
//! DO NOT change SEED or the generation order after games have been
//! imported into existing databases -- doing so would silently change
//! every position's identity. If the scheme ever needs to change, bump
//! `db_meta.node64_format` and provide a migration.

use crate::chess::{Board, Castling, Color, PieceType, Square};
use once_cell::sync::Lazy;

const SEED: u64 = 0x4E6F_6465_3634_4442; // ascii "Node64DB"

struct SplitMix64(u64);
impl SplitMix64 {
    fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E3779B97F4A7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
        z ^ (z >> 31)
    }
}

struct ZobristTable {
    /// [color][piece_type][square]
    pieces: [[[u64; 64]; 6]; 2],
    castling: [u64; 4], // WK, WQ, BK, BQ
    en_passant_file: [u64; 8],
    side_to_move: u64,
}

static TABLE: Lazy<ZobristTable> = Lazy::new(|| {
    let mut rng = SplitMix64(SEED);
    let mut pieces = [[[0u64; 64]; 6]; 2];
    for color in 0..2 {
        for piece in 0..6 {
            for square in 0..64 {
                pieces[color][piece][square] = rng.next();
            }
        }
    }
    let castling = [rng.next(), rng.next(), rng.next(), rng.next()];
    let mut en_passant_file = [0u64; 8];
    for f in en_passant_file.iter_mut() {
        *f = rng.next();
    }
    let side_to_move = rng.next();

    ZobristTable { pieces, castling, en_passant_file, side_to_move }
});

fn color_index(c: Color) -> usize {
    match c {
        Color::White => 0,
        Color::Black => 1,
    }
}

pub fn hash_board(board: &Board) -> u64 {
    let t = &*TABLE;
    let mut h: u64 = 0;

    for s in 0u8..64 {
        if let Some(p) = board.piece_at(s) {
            h ^= t.pieces[color_index(p.color)][p.kind.index()][s as usize];
        }
    }

    if board.castling.contains(Castling::WK) { h ^= t.castling[0]; }
    if board.castling.contains(Castling::WQ) { h ^= t.castling[1]; }
    if board.castling.contains(Castling::BK) { h ^= t.castling[2]; }
    if board.castling.contains(Castling::BQ) { h ^= t.castling[3]; }

    if let Some(ep) = board.en_passant {
        // Only relevant if an adjacent enemy pawn could actually capture;
        // for archival/search purposes we hash it unconditionally, matching
        // how FEN records it. This keeps hash <-> FEN reconstruction exact.
        h ^= t.en_passant_file[crate::chess::types::file_of(ep) as usize];
    }

    if board.side_to_move == Color::Black {
        h ^= t.side_to_move;
    }

    // SQLite INTEGER is i64; store the hash as a signed 64-bit reinterpretation.
    h
}

/// Convert a u64 zobrist hash to the i64 used for SQLite storage.
pub fn hash_to_i64(h: u64) -> i64 {
    h as i64
}

pub fn i64_to_hash(v: i64) -> u64 {
    v as u64
}

#[allow(unused)]
fn _unused(_: PieceType, _: Square) {}

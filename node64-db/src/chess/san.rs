use super::board::{Board, MoveSpec};
use super::movegen::{in_check, legal_moves};
use super::types::*;

/// Strip check/mate/annotation decorations so we can compare the "core" of
/// a SAN token, e.g. "Nf3+" -> "Nf3", "Qxe7#" -> "Qxe7".
fn strip_suffix(san: &str) -> &str {
    san.trim_end_matches(['+', '#', '!', '?'])
}

/// Compute the canonical SAN string for a legal move in a given position,
/// including disambiguation and check/mate suffixes.
pub fn move_to_san(board: &Board, mv: &MoveSpec, all_legal: &[MoveSpec]) -> String {
    let mut s = String::new();

    if mv.is_castle_kingside {
        s.push_str("O-O");
    } else if mv.is_castle_queenside {
        s.push_str("O-O-O");
    } else if mv.piece == PieceType::Pawn {
        if mv.capture {
            s.push((b'a' + file_of(mv.from)) as char);
            s.push('x');
        }
        s.push_str(&square_name(mv.to));
        if let Some(promo) = mv.promotion {
            s.push('=');
            s.push(promo.to_char());
        }
    } else {
        s.push(mv.piece.to_char());

        // disambiguation: find other legal moves of the same piece type
        // landing on the same square.
        let ambiguous: Vec<&MoveSpec> = all_legal
            .iter()
            .filter(|m| {
                m.piece == mv.piece
                    && m.to == mv.to
                    && m.from != mv.from
                    && !m.is_castle_kingside
                    && !m.is_castle_queenside
            })
            .collect();

        if !ambiguous.is_empty() {
            let same_file = ambiguous.iter().any(|m| file_of(m.from) == file_of(mv.from));
            let same_rank = ambiguous.iter().any(|m| rank_of(m.from) == rank_of(mv.from));
            if !same_file {
                s.push((b'a' + file_of(mv.from)) as char);
            } else if !same_rank {
                s.push((b'1' + rank_of(mv.from)) as char);
            } else {
                s.push_str(&square_name(mv.from));
            }
        }

        if mv.capture {
            s.push('x');
        }
        s.push_str(&square_name(mv.to));
    }

    let after = board.apply(mv);
    let opponent = board.side_to_move.opposite();
    if in_check(&after, opponent) {
        let has_moves = !legal_moves(&after).is_empty();
        s.push(if has_moves { '+' } else { '#' });
    }

    s
}

/// Given a SAN token (as it appears in a PGN, e.g. "Nf3", "exd5", "O-O",
/// "e8=Q+") and the current position, find the matching legal move.
pub fn parse_san(board: &Board, token: &str) -> Result<MoveSpec, String> {
    let target = strip_suffix(token);
    let candidates = legal_moves(board);

    for mv in &candidates {
        let candidate_san = move_to_san(board, mv, &candidates);
        if strip_suffix(&candidate_san) == target {
            return Ok(*mv);
        }
    }

    Err(format!("no legal move matches SAN token '{token}' in position {}", board.to_fen()))
}

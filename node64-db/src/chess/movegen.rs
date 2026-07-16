use super::board::{Board, MoveSpec};
use super::types::*;

const KNIGHT_DELTAS: [(i8, i8); 8] = [
    (1, 2), (2, 1), (2, -1), (1, -2),
    (-1, -2), (-2, -1), (-2, 1), (-1, 2),
];
const KING_DELTAS: [(i8, i8); 8] = [
    (1, 0), (1, 1), (0, 1), (-1, 1),
    (-1, 0), (-1, -1), (0, -1), (1, -1),
];
const BISHOP_DIRS: [(i8, i8); 4] = [(1, 1), (1, -1), (-1, 1), (-1, -1)];
const ROOK_DIRS: [(i8, i8); 4] = [(1, 0), (-1, 0), (0, 1), (0, -1)];

fn in_bounds(f: i8, r: i8) -> bool {
    (0..8).contains(&f) && (0..8).contains(&r)
}

/// Is `target` attacked by any piece of `by_color` in this position?
pub fn is_attacked(board: &Board, target: Square, by_color: Color) -> bool {
    let tf = file_of(target) as i8;
    let tr = rank_of(target) as i8;

    // Pawn attacks: a pawn of `by_color` attacks diagonally "forward" for it.
    let pawn_dir: i8 = if by_color == Color::White { -1 } else { 1 };
    for df in [-1i8, 1] {
        let f = tf + df;
        let r = tr + pawn_dir;
        if in_bounds(f, r) {
            if let Some(p) = board.piece_at(sq(f as u8, r as u8)) {
                if p.color == by_color && p.kind == PieceType::Pawn {
                    return true;
                }
            }
        }
    }

    for (df, dr) in KNIGHT_DELTAS {
        let f = tf + df;
        let r = tr + dr;
        if in_bounds(f, r) {
            if let Some(p) = board.piece_at(sq(f as u8, r as u8)) {
                if p.color == by_color && p.kind == PieceType::Knight {
                    return true;
                }
            }
        }
    }

    for (df, dr) in KING_DELTAS {
        let f = tf + df;
        let r = tr + dr;
        if in_bounds(f, r) {
            if let Some(p) = board.piece_at(sq(f as u8, r as u8)) {
                if p.color == by_color && p.kind == PieceType::King {
                    return true;
                }
            }
        }
    }

    for (df, dr) in BISHOP_DIRS {
        let mut f = tf + df;
        let mut r = tr + dr;
        while in_bounds(f, r) {
            if let Some(p) = board.piece_at(sq(f as u8, r as u8)) {
                if p.color == by_color && (p.kind == PieceType::Bishop || p.kind == PieceType::Queen) {
                    return true;
                }
                break;
            }
            f += df;
            r += dr;
        }
    }

    for (df, dr) in ROOK_DIRS {
        let mut f = tf + df;
        let mut r = tr + dr;
        while in_bounds(f, r) {
            if let Some(p) = board.piece_at(sq(f as u8, r as u8)) {
                if p.color == by_color && (p.kind == PieceType::Rook || p.kind == PieceType::Queen) {
                    return true;
                }
                break;
            }
            f += df;
            r += dr;
        }
    }

    false
}

fn find_king(board: &Board, color: Color) -> Option<Square> {
    for s in 0u8..64 {
        if let Some(p) = board.piece_at(s) {
            if p.color == color && p.kind == PieceType::King {
                return Some(s);
            }
        }
    }
    None
}

pub fn in_check(board: &Board, color: Color) -> bool {
    match find_king(board, color) {
        Some(k) => is_attacked(board, k, color.opposite()),
        None => false,
    }
}

/// All pseudo-legal moves (does not filter for king safety).
fn pseudo_legal_moves(board: &Board) -> Vec<MoveSpec> {
    let mut moves = Vec::new();
    let color = board.side_to_move;

    for from in 0u8..64 {
        let Some(piece) = board.piece_at(from) else { continue };
        if piece.color != color {
            continue;
        }
        let ff = file_of(from) as i8;
        let fr = rank_of(from) as i8;

        match piece.kind {
            PieceType::Pawn => gen_pawn_moves(board, from, color, &mut moves),
            PieceType::Knight => {
                for (df, dr) in KNIGHT_DELTAS {
                    let f = ff + df;
                    let r = fr + dr;
                    if in_bounds(f, r) {
                        push_if_valid(board, from, sq(f as u8, r as u8), piece.kind, color, &mut moves);
                    }
                }
            }
            PieceType::King => {
                for (df, dr) in KING_DELTAS {
                    let f = ff + df;
                    let r = fr + dr;
                    if in_bounds(f, r) {
                        push_if_valid(board, from, sq(f as u8, r as u8), piece.kind, color, &mut moves);
                    }
                }
                gen_castling(board, from, color, &mut moves);
            }
            PieceType::Bishop => gen_sliding(board, from, &BISHOP_DIRS, piece.kind, color, &mut moves),
            PieceType::Rook => gen_sliding(board, from, &ROOK_DIRS, piece.kind, color, &mut moves),
            PieceType::Queen => {
                gen_sliding(board, from, &BISHOP_DIRS, piece.kind, color, &mut moves);
                gen_sliding(board, from, &ROOK_DIRS, piece.kind, color, &mut moves);
            }
        }
    }

    moves
}

fn push_if_valid(
    board: &Board,
    from: Square,
    to: Square,
    kind: PieceType,
    color: Color,
    out: &mut Vec<MoveSpec>,
) {
    let target = board.piece_at(to);
    if let Some(t) = target {
        if t.color == color {
            return; // blocked by own piece
        }
    }
    out.push(MoveSpec {
        from,
        to,
        piece: kind,
        capture: target.is_some(),
        promotion: None,
        is_en_passant: false,
        is_castle_kingside: false,
        is_castle_queenside: false,
    });
}

fn gen_sliding(
    board: &Board,
    from: Square,
    dirs: &[(i8, i8)],
    kind: PieceType,
    color: Color,
    out: &mut Vec<MoveSpec>,
) {
    let ff = file_of(from) as i8;
    let fr = rank_of(from) as i8;
    for &(df, dr) in dirs {
        let mut f = ff + df;
        let mut r = fr + dr;
        while in_bounds(f, r) {
            let to = sq(f as u8, r as u8);
            match board.piece_at(to) {
                None => {
                    out.push(MoveSpec {
                        from, to, piece: kind, capture: false, promotion: None,
                        is_en_passant: false, is_castle_kingside: false, is_castle_queenside: false,
                    });
                }
                Some(t) => {
                    if t.color != color {
                        out.push(MoveSpec {
                            from, to, piece: kind, capture: true, promotion: None,
                            is_en_passant: false, is_castle_kingside: false, is_castle_queenside: false,
                        });
                    }
                    break;
                }
            }
            f += df;
            r += dr;
        }
    }
}

fn gen_pawn_moves(board: &Board, from: Square, color: Color, out: &mut Vec<MoveSpec>) {
    let ff = file_of(from) as i8;
    let fr = rank_of(from) as i8;
    let dir: i8 = if color == Color::White { 1 } else { -1 };
    let start_rank = if color == Color::White { 1 } else { 6 };
    let promo_rank = if color == Color::White { 7 } else { 0 };

    let push_with_promo = |to_f: i8, to_r: i8, capture: bool, is_ep: bool, out: &mut Vec<MoveSpec>| {
        if !in_bounds(to_f, to_r) {
            return;
        }
        let to = sq(to_f as u8, to_r as u8);
        if to_r == promo_rank as i8 {
            for promo in [PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight] {
                out.push(MoveSpec {
                    from, to, piece: PieceType::Pawn, capture, promotion: Some(promo),
                    is_en_passant: is_ep, is_castle_kingside: false, is_castle_queenside: false,
                });
            }
        } else {
            out.push(MoveSpec {
                from, to, piece: PieceType::Pawn, capture, promotion: None,
                is_en_passant: is_ep, is_castle_kingside: false, is_castle_queenside: false,
            });
        }
    };

    // single push
    let one_r = fr + dir;
    if in_bounds(ff, one_r) && board.piece_at(sq(ff as u8, one_r as u8)).is_none() {
        push_with_promo(ff, one_r, false, false, out);
        // double push
        if fr == start_rank {
            let two_r = fr + 2 * dir;
            if board.piece_at(sq(ff as u8, two_r as u8)).is_none() {
                out.push(MoveSpec {
                    from, to: sq(ff as u8, two_r as u8), piece: PieceType::Pawn,
                    capture: false, promotion: None, is_en_passant: false,
                    is_castle_kingside: false, is_castle_queenside: false,
                });
            }
        }
    }

    // captures
    for df in [-1i8, 1] {
        let cf = ff + df;
        let cr = fr + dir;
        if !in_bounds(cf, cr) {
            continue;
        }
        let to = sq(cf as u8, cr as u8);
        if let Some(t) = board.piece_at(to) {
            if t.color != color {
                push_with_promo(cf, cr, true, false, out);
            }
        } else if Some(to) == board.en_passant {
            push_with_promo(cf, cr, true, true, out);
        }
    }
}

fn gen_castling(board: &Board, from: Square, color: Color, out: &mut Vec<MoveSpec>) {
    let rank = if color == Color::White { 0 } else { 7 };
    if from != sq(4, rank) {
        return; // king not on its home square; skip (covers standard chess)
    }
    let opp = color.opposite();
    let (king_side, queen_side) = match color {
        Color::White => (Castling::WK, Castling::WQ),
        Color::Black => (Castling::BK, Castling::BQ),
    };

    if board.castling.contains(king_side) {
        let f1 = sq(5, rank);
        let g1 = sq(6, rank);
        if board.piece_at(f1).is_none() && board.piece_at(g1).is_none()
            && !is_attacked(board, from, opp)
            && !is_attacked(board, f1, opp)
            && !is_attacked(board, g1, opp)
        {
            out.push(MoveSpec {
                from, to: g1, piece: PieceType::King, capture: false, promotion: None,
                is_en_passant: false, is_castle_kingside: true, is_castle_queenside: false,
            });
        }
    }
    if board.castling.contains(queen_side) {
        let d1 = sq(3, rank);
        let c1 = sq(2, rank);
        let b1 = sq(1, rank);
        if board.piece_at(d1).is_none() && board.piece_at(c1).is_none() && board.piece_at(b1).is_none()
            && !is_attacked(board, from, opp)
            && !is_attacked(board, d1, opp)
            && !is_attacked(board, c1, opp)
        {
            out.push(MoveSpec {
                from, to: c1, piece: PieceType::King, capture: false, promotion: None,
                is_en_passant: false, is_castle_kingside: false, is_castle_queenside: true,
            });
        }
    }
}

/// All legal moves for the side to move: pseudo-legal moves filtered by
/// "does not leave my own king in check".
pub fn legal_moves(board: &Board) -> Vec<MoveSpec> {
    let color = board.side_to_move;
    pseudo_legal_moves(board)
        .into_iter()
        .filter(|mv| {
            let after = board.apply(mv);
            !in_check(&after, color)
        })
        .collect()
}

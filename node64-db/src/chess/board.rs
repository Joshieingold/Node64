use super::types::*;

pub const START_FEN: &str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MoveSpec {
    pub from: Square,
    pub to: Square,
    pub piece: PieceType,
    pub capture: bool,
    pub promotion: Option<PieceType>,
    pub is_en_passant: bool,
    pub is_castle_kingside: bool,
    pub is_castle_queenside: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Board {
    pub squares: [Option<Piece>; 64],
    pub side_to_move: Color,
    pub castling: Castling,
    pub en_passant: Option<Square>,
    pub halfmove_clock: u32,
    pub fullmove_number: u32,
}

impl Board {
    pub fn from_fen(fen: &str) -> Result<Board, String> {
        let parts: Vec<&str> = fen.trim().split_whitespace().collect();
        if parts.len() < 4 {
            return Err(format!("invalid FEN, not enough fields: {fen}"));
        }
        let mut squares: [Option<Piece>; 64] = [None; 64];
        let ranks: Vec<&str> = parts[0].split('/').collect();
        if ranks.len() != 8 {
            return Err(format!("invalid FEN board field: {fen}"));
        }
        for (i, rank_str) in ranks.iter().enumerate() {
            let rank = 7 - i as u8; // FEN starts at rank 8
            let mut file = 0u8;
            for c in rank_str.chars() {
                if let Some(d) = c.to_digit(10) {
                    file += d as u8;
                } else {
                    let piece = Piece::from_fen_char(c).ok_or_else(|| format!("bad piece char {c}"))?;
                    if file > 7 {
                        return Err(format!("rank overflow in FEN: {fen}"));
                    }
                    squares[sq(file, rank) as usize] = Some(piece);
                    file += 1;
                }
            }
        }

        let side_to_move = match parts[1] {
            "w" => Color::White,
            "b" => Color::Black,
            _ => return Err(format!("bad side-to-move field: {}", parts[1])),
        };

        let mut castling = Castling::empty();
        if parts[2] != "-" {
            for c in parts[2].chars() {
                match c {
                    'K' => castling.insert(Castling::WK),
                    'Q' => castling.insert(Castling::WQ),
                    'k' => castling.insert(Castling::BK),
                    'q' => castling.insert(Castling::BQ),
                    _ => {} // Chess960 castling letters ignored for simplicity
                }
            }
        }

        let en_passant = if parts[3] == "-" { None } else { square_from_name(parts[3]) };

        let halfmove_clock = parts.get(4).and_then(|s| s.parse().ok()).unwrap_or(0);
        let fullmove_number = parts.get(5).and_then(|s| s.parse().ok()).unwrap_or(1);

        Ok(Board {
            squares,
            side_to_move,
            castling,
            en_passant,
            halfmove_clock,
            fullmove_number,
        })
    }

    pub fn start_position() -> Board {
        Board::from_fen(START_FEN).unwrap()
    }

    pub fn to_fen(&self) -> String {
        let mut out = String::new();
        for i in 0..8 {
            let rank = 7 - i;
            let mut empty = 0u8;
            for file in 0..8 {
                match self.squares[sq(file, rank) as usize] {
                    None => empty += 1,
                    Some(p) => {
                        if empty > 0 {
                            out.push_str(&empty.to_string());
                            empty = 0;
                        }
                        out.push(p.to_fen_char());
                    }
                }
            }
            if empty > 0 {
                out.push_str(&empty.to_string());
            }
            if i != 7 {
                out.push('/');
            }
        }
        out.push(' ');
        out.push(match self.side_to_move {
            Color::White => 'w',
            Color::Black => 'b',
        });
        out.push(' ');
        let mut cast = String::new();
        if self.castling.contains(Castling::WK) { cast.push('K'); }
        if self.castling.contains(Castling::WQ) { cast.push('Q'); }
        if self.castling.contains(Castling::BK) { cast.push('k'); }
        if self.castling.contains(Castling::BQ) { cast.push('q'); }
        out.push_str(if cast.is_empty() { "-" } else { &cast });
        out.push(' ');
        out.push_str(&self.en_passant.map(square_name).unwrap_or_else(|| "-".to_string()));
        out.push(' ');
        out.push_str(&self.halfmove_clock.to_string());
        out.push(' ');
        out.push_str(&self.fullmove_number.to_string());
        out
    }

    pub fn piece_at(&self, s: Square) -> Option<Piece> {
        self.squares[s as usize]
    }

    /// Apply a fully-specified move. Assumes it is pseudo-legal; does NOT
    /// verify legality (i.e. does not check that the mover's king is safe
    /// afterwards -- callers that need legality should use movegen).
    pub fn apply(&self, mv: &MoveSpec) -> Board {
        let mut b = self.clone();
        let mover = b.squares[mv.from as usize].expect("apply: no piece on from-square");
        let moving_color = mover.color;

        // clear en passant by default; recomputed below if a double pawn push
        let mut new_en_passant = None;

        // handle en passant capture: remove the captured pawn
        if mv.is_en_passant {
            let captured_sq = if moving_color == Color::White {
                mv.to - 8
            } else {
                mv.to + 8
            };
            b.squares[captured_sq as usize] = None;
        }

        // move the piece
        b.squares[mv.from as usize] = None;
        let placed = if let Some(promo) = mv.promotion {
            Piece::new(moving_color, promo)
        } else {
            mover
        };
        b.squares[mv.to as usize] = Some(placed);

        // castling: move the rook too
        if mv.is_castle_kingside {
            let rank = rank_of(mv.from);
            let rook_from = sq(7, rank);
            let rook_to = sq(5, rank);
            b.squares[rook_from as usize] = None;
            b.squares[rook_to as usize] = Some(Piece::new(moving_color, PieceType::Rook));
        } else if mv.is_castle_queenside {
            let rank = rank_of(mv.from);
            let rook_from = sq(0, rank);
            let rook_to = sq(3, rank);
            b.squares[rook_from as usize] = None;
            b.squares[rook_to as usize] = Some(Piece::new(moving_color, PieceType::Rook));
        }

        // double pawn push -> set en passant target
        if mv.piece == PieceType::Pawn {
            let from_rank = rank_of(mv.from);
            let to_rank = rank_of(mv.to);
            if (to_rank as i8 - from_rank as i8).abs() == 2 {
                let ep_rank = (from_rank + to_rank) / 2;
                new_en_passant = Some(sq(file_of(mv.from), ep_rank));
            }
        }
        b.en_passant = new_en_passant;

        // update castling rights
        let strip = |c: &mut Castling, s: Square| {
            match s {
                0 => c.remove(Castling::WQ),  // a1
                7 => c.remove(Castling::WK),  // h1
                56 => c.remove(Castling::BQ), // a8
                63 => c.remove(Castling::BK), // h8
                4 => { c.remove(Castling::WK); c.remove(Castling::WQ); } // e1
                60 => { c.remove(Castling::BK); c.remove(Castling::BQ); } // e8
                _ => {}
            }
        };
        strip(&mut b.castling, mv.from);
        strip(&mut b.castling, mv.to);

        // halfmove clock
        if mv.piece == PieceType::Pawn || mv.capture {
            b.halfmove_clock = 0;
        } else {
            b.halfmove_clock += 1;
        }

        if moving_color == Color::Black {
            b.fullmove_number += 1;
        }

        b.side_to_move = moving_color.opposite();
        b
    }
}

use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Color {
    White,
    Black,
}

impl Color {
    pub fn opposite(self) -> Color {
        match self {
            Color::White => Color::Black,
            Color::Black => Color::White,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PieceType {
    Pawn,
    Knight,
    Bishop,
    Rook,
    Queen,
    King,
}

impl PieceType {
    pub fn to_char(self) -> char {
        match self {
            PieceType::Pawn => 'P',
            PieceType::Knight => 'N',
            PieceType::Bishop => 'B',
            PieceType::Rook => 'R',
            PieceType::Queen => 'Q',
            PieceType::King => 'K',
        }
    }

    pub fn from_char(c: char) -> Option<PieceType> {
        match c.to_ascii_uppercase() {
            'P' => Some(PieceType::Pawn),
            'N' => Some(PieceType::Knight),
            'B' => Some(PieceType::Bishop),
            'R' => Some(PieceType::Rook),
            'Q' => Some(PieceType::Queen),
            'K' => Some(PieceType::King),
            _ => None,
        }
    }

    /// Index 0..6, used for Zobrist table lookups.
    pub fn index(self) -> usize {
        match self {
            PieceType::Pawn => 0,
            PieceType::Knight => 1,
            PieceType::Bishop => 2,
            PieceType::Rook => 3,
            PieceType::Queen => 4,
            PieceType::King => 5,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Piece {
    pub color: Color,
    pub kind: PieceType,
}

impl Piece {
    pub fn new(color: Color, kind: PieceType) -> Self {
        Piece { color, kind }
    }

    pub fn to_fen_char(self) -> char {
        let c = self.kind.to_char();
        match self.color {
            Color::White => c,
            Color::Black => c.to_ascii_lowercase(),
        }
    }

    pub fn from_fen_char(c: char) -> Option<Piece> {
        let kind = PieceType::from_char(c)?;
        let color = if c.is_ascii_uppercase() { Color::White } else { Color::Black };
        Some(Piece::new(color, kind))
    }
}

/// Square index 0..64, 0 = a1, 7 = h1, 56 = a8, 63 = h8 (little-endian rank-file).
pub type Square = u8;

pub fn sq(file: u8, rank: u8) -> Square {
    rank * 8 + file
}

pub fn file_of(s: Square) -> u8 {
    s % 8
}

pub fn rank_of(s: Square) -> u8 {
    s / 8
}

pub fn square_name(s: Square) -> String {
    let f = (b'a' + file_of(s)) as char;
    let r = (b'1' + rank_of(s)) as char;
    format!("{f}{r}")
}

pub fn square_from_name(name: &str) -> Option<Square> {
    let bytes = name.as_bytes();
    if bytes.len() != 2 {
        return None;
    }
    let file = bytes[0].to_ascii_lowercase().checked_sub(b'a')?;
    let rank = bytes[1].checked_sub(b'1')?;
    if file > 7 || rank > 7 {
        return None;
    }
    Some(sq(file, rank))
}

impl fmt::Display for Piece {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_fen_char())
    }
}

bitflags_lite::bitflags_lite! {
    pub struct Castling: u8 {
        const WK = 0b0001;
        const WQ = 0b0010;
        const BK = 0b0100;
        const BQ = 0b1000;
    }
}

/// Minimal bitflags replacement so we don't need the `bitflags` crate.
mod bitflags_lite {
    macro_rules! bitflags_lite {
        (pub struct $name:ident: $t:ty { $(const $flag:ident = $val:expr;)* }) => {
            #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
            pub struct $name(pub $t);
            impl $name {
                $(pub const $flag: $name = $name($val);)*
                pub fn empty() -> Self { $name(0) }
                pub fn contains(self, other: $name) -> bool { self.0 & other.0 == other.0 }
                pub fn insert(&mut self, other: $name) { self.0 |= other.0; }
                pub fn remove(&mut self, other: $name) { self.0 &= !other.0; }
                pub fn bits(self) -> $t { self.0 }
            }
            impl std::ops::BitOr for $name {
                type Output = $name;
                fn bitor(self, rhs: $name) -> $name { $name(self.0 | rhs.0) }
            }
        };
    }
    pub(crate) use bitflags_lite;
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameRecord {
    pub id: i64,
    pub uuid: String,
    pub white: Option<String>,
    pub black: Option<String>,
    pub event: Option<String>,
    pub site: Option<String>,
    pub date: Option<String>,
    pub round: Option<String>,
    pub result: Option<String>,
    pub eco: Option<String>,
    pub white_elo: Option<i64>,
    pub black_elo: Option<i64>,
    pub start_fen: String,
    pub is_chess960: bool,
    pub ply_count: i64,
    pub pgn: String,
    pub source: Option<String>,
    pub imported_at: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameSummary {
    pub id: i64,
    pub uuid: String,
    pub white: Option<String>,
    pub black: Option<String>,
    pub result: Option<String>,
    pub date: Option<String>,
    pub event: Option<String>,
    pub eco: Option<String>,
    pub white_elo: Option<i64>,
    pub black_elo: Option<i64>,
    pub ply_count: i64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchFilters {
    pub player: Option<String>,        // matches white OR black
    pub white: Option<String>,
    pub black: Option<String>,
    pub eco: Option<String>,
    pub opening_name: Option<String>,  // reserved for future ECO->name table
    pub result: Option<String>,        // "1-0" | "0-1" | "1/2-1/2"
    pub date_from: Option<String>,     // "YYYY.MM.DD" or "YYYY"
    pub date_to: Option<String>,
    pub min_elo: Option<i64>,          // both players >= min_elo
    pub event: Option<String>,
    pub move_sequence: Option<String>, // e.g. "1.e4 c6 2.d4 d5"
    pub fen: Option<String>,           // exact position search
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort_by: Option<String>,       // "date" | "white" | "black" | "elo"
    pub sort_desc: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub games: Vec<GameSummary>,
    pub total_count: i64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStats {
    pub total_games: i64,
    pub white_wins: i64,
    pub black_wins: i64,
    pub draws: i64,
    pub other: i64,
    pub white_win_pct: f64,
    pub black_win_pct: f64,
    pub draw_pct: f64,
    pub avg_white_elo: Option<f64>,
    pub avg_black_elo: Option<f64>,
    pub avg_year: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExplorerMove {
    pub san: String,
    pub games: i64,
    pub white_wins: i64,
    pub black_wins: i64,
    pub draws: i64,
    pub avg_rating: Option<f64>,
    pub score_pct: f64, // from White's perspective: (wins + 0.5*draws)/games
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExplorerResult {
    pub position_fen: String,
    pub total_games: i64,
    pub moves: Vec<ExplorerMove>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub imported: i64,
    pub skipped_duplicates: i64,
    pub failed: i64,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseInfo {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub game_count: i64,
    pub position_count: i64,
    pub is_open: bool,
}

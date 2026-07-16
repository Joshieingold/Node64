//! A pragmatic PGN parser.
//!
//! Handles: multi-game files, tag pairs, comments `{ ... }`, NAGs `$n`,
//! nested variations `( ... )` (skipped, not indexed), result tokens, and
//! move numbers. It intentionally does not try to validate movetext syntax
//! beyond what's needed to pull out ordered SAN tokens -- semantic
//! validity (legality) is checked later by replaying moves on a Board.

use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct ParsedGame {
    pub tags: HashMap<String, String>,
    pub sans: Vec<String>,
    pub raw_pgn: String,
}

impl ParsedGame {
    pub fn tag(&self, key: &str) -> Option<&str> {
        self.tags.get(key).map(|s| s.as_str())
    }
}

/// Split a multi-game PGN blob into individual game texts.
/// A new game starts at a line beginning with `[Event ` provided we've
/// already seen movetext for the current game (handles PGNs with blank
/// lines between the tag block and movetext, and back-to-back games).
pub fn split_games(pgn_text: &str) -> Vec<String> {
    let mut games = Vec::new();
    let mut current = String::new();
    let mut seen_movetext = false;

    for line in pgn_text.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("[Event ") && seen_movetext {
            if !current.trim().is_empty() {
                games.push(current.trim().to_string());
            }
            current = String::new();
            seen_movetext = false;
        }
        if !trimmed.starts_with('[') && !trimmed.is_empty() {
            seen_movetext = true;
        }
        current.push_str(line);
        current.push('\n');
    }
    if !current.trim().is_empty() {
        games.push(current.trim().to_string());
    }
    games
}

/// Parse a single game's PGN text (tags + movetext) into a ParsedGame.
pub fn parse_game(raw: &str) -> Result<ParsedGame, String> {
    let mut tags = HashMap::new();
    let mut movetext_lines = Vec::new();

    for line in raw.lines() {
        let t = line.trim();
        if t.starts_with('[') && t.ends_with(']') {
            if let Some((key, value)) = parse_tag_line(t) {
                tags.insert(key, value);
            }
        } else if !t.is_empty() {
            movetext_lines.push(t);
        }
    }

    let movetext = movetext_lines.join(" ");
    let sans = tokenize_movetext(&movetext);

    Ok(ParsedGame {
        tags,
        sans,
        raw_pgn: raw.trim().to_string(),
    })
}

fn parse_tag_line(line: &str) -> Option<(String, String)> {
    // [Key "Value"]
    let inner = &line[1..line.len() - 1]; // strip [ ]
    let space_idx = inner.find(' ')?;
    let key = inner[..space_idx].trim().to_string();
    let rest = inner[space_idx + 1..].trim();
    let value = rest.trim_matches('"').to_string();
    Some((key, value))
}

/// Extract ordered SAN move tokens from movetext, stripping comments,
/// variations, NAGs, move numbers, and the final result token.
fn tokenize_movetext(movetext: &str) -> Vec<String> {
    let mut sans = Vec::new();
    let chars: Vec<char> = movetext.chars().collect();
    let mut i = 0;
    let mut depth = 0i32; // variation nesting depth

    while i < chars.len() {
        let c = chars[i];

        if c == '{' {
            // skip comment
            while i < chars.len() && chars[i] != '}' {
                i += 1;
            }
            i += 1;
            continue;
        }
        if c == ';' {
            // rest-of-line comment
            while i < chars.len() && chars[i] != '\n' {
                i += 1;
            }
            continue;
        }
        if c == '(' {
            depth += 1;
            i += 1;
            continue;
        }
        if c == ')' {
            depth -= 1;
            i += 1;
            continue;
        }
        if depth > 0 {
            i += 1;
            continue;
        }
        if c.is_whitespace() {
            i += 1;
            continue;
        }

        // collect a token
        let start = i;
        while i < chars.len() && !chars[i].is_whitespace() && chars[i] != '{' && chars[i] != '(' {
            i += 1;
        }
        let token: String = chars[start..i].iter().collect();
        if let Some(san) = clean_token(&token) {
            sans.push(san);
        }
    }

    sans
}

fn clean_token(token: &str) -> Option<String> {
    let t = token.trim();
    if t.is_empty() {
        return None;
    }
    // result tokens
    if matches!(t, "1-0" | "0-1" | "1/2-1/2" | "*") {
        return None;
    }
    // NAG
    if t.starts_with('$') {
        return None;
    }
    // move number like "1." "1..." "12."
    if t.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false) {
        // strip leading digits and dots; if nothing meaningful remains, skip
        let stripped: String = t.trim_start_matches(|c: char| c.is_ascii_digit() || c == '.').to_string();
        if stripped.is_empty() {
            return None;
        }
        return Some(stripped);
    }
    Some(t.to_string())
}

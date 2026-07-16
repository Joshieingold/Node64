-- Node64 database schema
-- One SQLite file = one independent, self-contained game database.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Positions: every distinct position reached by any imported game.
-- A position exists exactly once. Games reference positions instead of
-- duplicating board state, which is what makes search / the opening
-- explorer fast.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
    id           INTEGER PRIMARY KEY,
    zobrist_hash INTEGER NOT NULL UNIQUE,
    fen          TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_positions_hash ON positions(zobrist_hash);

-- ---------------------------------------------------------------------
-- Games: metadata for a single imported game. Purely archival.
-- No engine evaluations, no repertoire data, no annotations live here.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
    id           INTEGER PRIMARY KEY,
    uuid         TEXT    NOT NULL UNIQUE,

    white        TEXT,
    black        TEXT,
    event        TEXT,
    site         TEXT,
    date         TEXT,       -- PGN-style "YYYY.MM.DD" (partial dates allowed)
    round        TEXT,
    result       TEXT,       -- "1-0" | "0-1" | "1/2-1/2" | "*"
    eco          TEXT,
    white_elo    INTEGER,
    black_elo    INTEGER,

    start_fen    TEXT    NOT NULL,   -- standard start, custom FEN, Chess960, etc.
    is_chess960  INTEGER NOT NULL DEFAULT 0,
    ply_count    INTEGER NOT NULL DEFAULT 0,

    pgn          TEXT    NOT NULL,   -- original PGN kept verbatim for reconstruction

    source       TEXT,               -- e.g. "manual-import", "lichess", "analysis-doc"
    imported_at  TEXT    NOT NULL    -- ISO-8601 UTC timestamp
);

CREATE INDEX IF NOT EXISTS idx_games_white   ON games(white);
CREATE INDEX IF NOT EXISTS idx_games_black   ON games(black);
CREATE INDEX IF NOT EXISTS idx_games_eco     ON games(eco);
CREATE INDEX IF NOT EXISTS idx_games_date    ON games(date);
CREATE INDEX IF NOT EXISTS idx_games_result  ON games(result);
CREATE INDEX IF NOT EXISTS idx_games_uuid    ON games(uuid);

-- ---------------------------------------------------------------------
-- Game <-> Position join table. One row per ply per game.
-- move_san / move_uci describe the move played FROM this position that
-- leads to the next ply (NULL on the final position of the game).
-- This single table drives move-sequence search, position search, and
-- the opening explorer.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_positions (
    game_id     INTEGER NOT NULL REFERENCES games(id)     ON DELETE CASCADE,
    ply         INTEGER NOT NULL,           -- 0 = start_fen position
    position_id INTEGER NOT NULL REFERENCES positions(id),
    move_san    TEXT,                       -- move played from this position (nullable)
    move_uci    TEXT,
    PRIMARY KEY (game_id, ply)
);

CREATE INDEX IF NOT EXISTS idx_gp_position ON game_positions(position_id);
CREATE INDEX IF NOT EXISTS idx_gp_game     ON game_positions(game_id);

-- ---------------------------------------------------------------------
-- Bookkeeping
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS db_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO db_meta (key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO db_meta (key, value) VALUES ('node64_format', '1');

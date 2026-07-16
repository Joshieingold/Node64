# Node64 Database

A searchable SQLite-backed chess game database, matching the Node64 spec:
databases are `.n64db` files, one open at a time, purely archival (no
engine data, no repertoires), with every position indexed for fast search
and an opening explorer.

## What's in this crate

```
src/
  chess/            minimal legal-move-generation chess engine
    types.rs         Color, PieceType, Piece, Square helpers
    board.rs          Board state, FEN parse/serialize, move application
    movegen.rs         pseudo-legal + legal move generation, check detection
    san.rs              move <-> SAN conversion (with disambiguation)
  zobrist.rs         deterministic, fixed-seed position hashing
  pgn.rs             PGN tokenizer (tags, movetext, comments, variations)
  import.rs          PGN -> replay -> index positions -> insert game
  search.rs          filtered search (player/ECO/date/Elo/position/moves)
  explorer.rs        opening explorer (frequency, scores, avg rating)
  db.rs              connection lifecycle: create/open/close/list/delete
  models.rs           shared structs, also serialized to the frontend
  commands.rs        #[tauri::command] wrappers around all of the above
  util.rs            tiny dependency-free UUID v4 generator
schema.sql           the SQLite schema (positions / games / game_positions)
tests/basic.rs       engine + import round-trip tests
```

Why a hand-written chess engine instead of a crate like `shakmaty`? Using
one is a fine substitution if you'd rather -- swap `chess/` out and keep
`parse_san` / `Board::to_fen` / `hash_board`'s call sites the same. This
version has zero non-SQLite dependencies and is deliberately small enough
to read end to end.

## Wiring into your Tauri app

1. Add this crate as a path dependency in `src-tauri/Cargo.toml`:

   ```toml
   [dependencies]
   node64_db = { path = "../node64-db" }
   ```

2. In `src-tauri/src/main.rs`:

   ```rust
   fn main() {
       tauri::Builder::default()
           .setup(|app| node64_db::init(app))
           .invoke_handler(tauri::generate_handler![
               node64_db::commands::n64_list_databases,
               node64_db::commands::n64_create_database,
               node64_db::commands::n64_open_database,
               node64_db::commands::n64_close_database,
               node64_db::commands::n64_delete_database,
               node64_db::commands::n64_rename_database,
               node64_db::commands::n64_current_database,
               node64_db::commands::n64_import_pgn_text,
               node64_db::commands::n64_import_pgn_file,
               node64_db::commands::n64_search_games,
               node64_db::commands::n64_search_stats,
               node64_db::commands::n64_get_game,
               node64_db::commands::n64_delete_game,
               node64_db::commands::n64_explorer_by_fen,
               node64_db::commands::n64_explorer_by_moves,
               node64_db::commands::n64_representative_games,
           ])
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```

3. From the frontend, resolve your `ChessData/Databases` directory (e.g.
   with `@tauri-apps/api/path` -> `appDataDir()` + `"ChessData/Databases"`)
   and pass it as `databases_dir` to the database-lifecycle commands.

## Frontend usage examples

```ts
import { invoke } from "@tauri-apps/api/core";

const databasesDir = "/Users/you/Library/Application Support/YourApp/ChessData/Databases";

// Create + open
await invoke("n64_create_database", { databasesDir, name: "Master Games" });
await invoke("n64_open_database", { databasesDir, name: "Master Games" });

// Import
const summary = await invoke("n64_import_pgn_file", {
  filePath: "/Users/you/Downloads/candidates2026.pgn",
});
// { imported: 412, skippedDuplicates: 3, failed: 0, errors: [] }

// Search: Carlsen, as Black, Sicilian, won
const results = await invoke("n64_search_games", {
  filters: {
    player: "Carlsen",
    black: "Carlsen",
    eco: "B90",
    result: "0-1",
    limit: 100,
  },
});

// Position search: paste any FEN
const byPosition = await invoke("n64_search_games", {
  filters: { fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2" },
});

// Move-sequence search
const bySequence = await invoke("n64_search_games", {
  filters: { moveSequence: "1.e4 c6" },
});

// Opening explorer at the current board position
const explorer = await invoke("n64_explorer_by_moves", { moveSequence: "1.e4 c6 2.d4 d5" });
// { positionFen, totalGames, moves: [{ san, games, whiteWins, blackWins, draws, avgRating, scorePct }, ...] }

// Stats over a filtered set
const stats = await invoke("n64_search_stats", { filters: { eco: "B90" } });
```

## Design notes / how this maps to the spec

- **One database, one file, one connection at a time.** `DbState` holds a
  single optional open `rusqlite::Connection`. Opening a different
  database just closes the old handle and opens the new file -- no
  cross-database state leaks.
- **Positions are deduplicated globally within a database.** `positions`
  has a `UNIQUE` constraint on `zobrist_hash`; `import.rs` looks a hash up
  before inserting, so a position reached by thousands of games is stored
  once and referenced via `game_positions`.
- **Zobrist hashing is deterministic and versioned.** The table is
  generated from a fixed seed (`SEED` in `zobrist.rs`) so the same
  position always hashes the same way across runs, machines, and app
  updates. `db_meta.node64_format` exists so a future hashing-scheme
  change can be migrated deliberately instead of silently corrupting
  lookups.
- **Every game gets an INTEGER id and a UUID.** The integer id is fast and
  local; the UUID (`util::new_uuid_v4`) is what makes duplicate detection,
  future sync, and external references stable across databases and
  re-imports.
- **Duplicate detection is two-layered.** First by UUID (exact re-import,
  including from a Node64 export carrying a `Node64UUID`/`GameId` tag),
  then by a content fingerprint (players + date + move count) for games
  that reach the database from a different source without a shared UUID.
- **The opening explorer needs no separate database.** `game_positions`
  already stores, for every ply of every game, which move was played from
  that position. `explorer.rs` just aggregates that table by
  `position_id`, which is exactly the "frequency / score / rating" view
  the spec describes -- it falls out of the same indexing used for
  position search.
- **Nothing here stores engine output, repertoire trees, or annotations.**
  That's intentional -- those stay in `.pgn` / `.n64rep` documents on disk,
  per the "no engine data / no repertoires" sections of the spec. If you
  later want a "send this position to the database's opening explorer"
  button from an analysis document, that's just calling
  `n64_explorer_by_fen` with the document's current FEN -- no schema
  change required.

## Known limitations / good next steps

- `Board`/`movegen` implement standard chess fully (including castling, en
  passant, promotion) and Chess960 *storage* (custom start FEN, a
  `is_chess960` flag), but move generation's castling detection assumes
  the king starts on e1/e8 -- true Chess960 castling (king/rook starting
  anywhere) would need a small extension to `gen_castling`.
- `import.rs`'s cross-source duplicate check compares player names, date,
  and ply count before falling back to a full move comparison; wiring in
  the full SAN-by-SAN comparison (the fingerprint is already computed) is
  a one-function addition if you see false negatives in practice.
- Clipboard / drag-and-drop / online-source import are frontend
  concerns -- they just need to produce a PGN string and call
  `n64_import_pgn_text`.
- `search.rs`'s `opening_name` filter field is reserved but unimplemented;
  add an `eco_names` static table (ECO code -> opening name) and match
  against it once you have data you're happy shipping.

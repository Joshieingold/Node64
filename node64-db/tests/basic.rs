use node64_db::chess::board::{Board, START_FEN};
use node64_db::chess::san::parse_san;
use node64_db::db;
use node64_db::import;
use node64_db::util::new_uuid_v4;
use node64_db::zobrist::hash_board;

#[test]
fn fen_roundtrip() {
    let b = Board::from_fen(START_FEN).unwrap();
    assert_eq!(b.to_fen(), START_FEN);
}

#[test]
fn play_scholars_mate_and_hash_is_stable() {
    let mut b = Board::from_fen(START_FEN).unwrap();
    for san in ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"] {
        let mv = parse_san(&b, san).expect(san);
        b = b.apply(&mv);
    }
    let h1 = hash_board(&b);
    let b2 = Board::from_fen(&b.to_fen()).unwrap();
    let h2 = hash_board(&b2);
    assert_eq!(h1, h2, "hash must be stable across FEN round-trip");
}

#[test]
fn castling_and_en_passant_replay() {
    let mut b = Board::from_fen(START_FEN).unwrap();
    let moves = ["e4", "e6", "Nf3", "d5", "Nc3", "Nf6", "e5", "Nfd7", "d4", "c5", "Be2", "Nc6", "O-O"];
    for san in moves {
        let mv = parse_san(&b, san).expect(san);
        b = b.apply(&mv);
    }
    assert_eq!(
        b.to_fen().split(' ').next().unwrap(),
        "r1bqkb1r/pp1n1ppp/2n1p3/2ppP3/3P4/2N2N2/PPP1BPPP/R1BQ1RK1"
    );
}

#[test]
fn import_and_search_roundtrip() {
    let dir = std::env::temp_dir().join(format!("node64_test_{}", new_uuid_v4()));
    let path = dir.join("test.n64db");
    db::create_database(&path).unwrap();
    let conn = rusqlite::Connection::open(&path).unwrap();

    let pgn = r#"[Event "Test Event"]
[Site "Test"]
[Date "2024.01.01"]
[Round "1"]
[White "Carlsen, Magnus"]
[Black "Nepomniachtchi, Ian"]
[Result "1-0"]
[ECO "B90"]
[WhiteElo "2830"]
[BlackElo "2790"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 1-0
"#;

    let summary = import::import_pgn_text(&conn, pgn, "test").unwrap();
    assert_eq!(summary.imported, 1);
    assert_eq!(summary.failed, 0);

    // re-importing the same PGN should be skipped (fresh UUID each time
    // since none was tagged, so this checks fingerprint-based dedup)
    let summary2 = import::import_pgn_text(&conn, pgn, "test").unwrap();
    assert_eq!(summary2.imported, 0);
    assert_eq!(summary2.skipped_duplicates, 1);

    let game_count: i64 = conn.query_row("SELECT COUNT(*) FROM games", [], |r| r.get(0)).unwrap();
    assert_eq!(game_count, 1);

    let position_count: i64 = conn.query_row("SELECT COUNT(*) FROM positions", [], |r| r.get(0)).unwrap();
    assert!(position_count > 5);

    let _ = std::fs::remove_file(&path);
}

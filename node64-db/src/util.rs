//! Minimal dependency-free UUID v4 generation.
//!
//! We don't need cryptographic randomness here -- UUIDs are used as stable
//! external identifiers for dedup/sync, and real duplicate protection also
//! relies on the content fingerprint check in `import.rs`. This avoids
//! pulling in the `uuid`/`getrandom` crates and their transitive version
//! churn.

use std::cell::Cell;
use std::time::{SystemTime, UNIX_EPOCH};

thread_local! {
    static RNG_STATE: Cell<u64> = Cell::new(seed());
}

fn seed() -> u64 {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0x9E3779B97F4A7C15);
    // mix in the address of a stack variable for a bit of extra entropy
    let stack_addr = &nanos as *const u64 as u64;
    nanos ^ stack_addr.rotate_left(17)
}

fn next_u64() -> u64 {
    RNG_STATE.with(|s| {
        let mut z = s.get().wrapping_add(0x9E3779B97F4A7C15);
        s.set(z);
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
        z ^ (z >> 31)
    })
}

/// Generate a random UUID (v4 format, RFC 4122 variant bits set).
pub fn new_uuid_v4() -> String {
    let hi = next_u64();
    let lo = next_u64();
    let mut bytes = [0u8; 16];
    bytes[0..8].copy_from_slice(&hi.to_be_bytes());
    bytes[8..16].copy_from_slice(&lo.to_be_bytes());

    bytes[6] = (bytes[6] & 0x0F) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3F) | 0x80; // variant RFC4122

    format!(
        "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        bytes[0], bytes[1], bytes[2], bytes[3],
        bytes[4], bytes[5],
        bytes[6], bytes[7],
        bytes[8], bytes[9],
        bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]
    )
}

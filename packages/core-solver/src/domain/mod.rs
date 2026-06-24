//! Domain types — the source of truth (types only; no algorithms, no I/O).
//! Exported to TS via ts-rs in a later phase. See docs/DATA-MODEL.md.

mod stat;
pub use stat::{Stat, Stats, STAT_COUNT};

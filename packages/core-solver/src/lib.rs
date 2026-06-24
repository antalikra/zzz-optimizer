//! ZZZ Optimizer solver core.
//!
//! Module layout mirrors the architecture (see the local `docs/` design notes):
//! `domain` <- {`data`, `formula`, `solver`} <- `api`. The core does no I/O and
//! is a pure function so it ports to the desktop (Tauri) build unchanged.

pub mod api;
pub mod data;
pub mod domain;
pub mod formula;
pub mod logging;
pub mod solver;

/// Crate version, surfaced to the JS side as the Phase-0 handshake.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

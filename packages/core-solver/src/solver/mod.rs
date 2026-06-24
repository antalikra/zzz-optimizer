//! Branch-and-bound solver. See docs/SOLVER.md.
//! Invariants: monotonicity-sign bound, dominance over objective ∪ constraint
//! stats within a set-combo, no allocation / no logging in the hot loop.

pub mod brute;
pub mod model;
pub mod search;

pub use model::{BuildResult, Constraint, Disc, Objective};
pub use search::{solve, solve_with};

use serde::Serialize;

#[derive(Debug, Serialize)]
struct SolvePlaceholder {
    status: &'static str,
    note: &'static str,
}

/// JSON entry point for the WASM boundary. The in-Rust [`solve`] exists and is
/// tested; wiring a JSON request/response schema through here is Phase 4.
pub fn solve_json(_request_json: &str) -> String {
    let out = SolvePlaceholder {
        status: "ok",
        note: "solver core ready (in-Rust); JSON bridge lands in Phase 4",
    };
    serde_json::to_string(&out)
        .unwrap_or_else(|e| format!("{{\"status\":\"error\",\"note\":\"{e}\"}}"))
}

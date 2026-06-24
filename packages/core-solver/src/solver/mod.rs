//! Branch-and-bound solver. Implemented in Phase 3. See docs/SOLVER.md.
//! Invariants to preserve when implementing: monotonicity-sign bound,
//! dominance over objective ∪ constraint stats within a set-combo, no
//! allocation / no logging in the hot loop.

use serde::Serialize;

#[derive(Debug, Serialize)]
struct SolvePlaceholder {
    status: &'static str,
    note: &'static str,
}

/// Phase-0 placeholder: returns a structured JSON result so the TS worker has a
/// real round-trip to integrate against before the real solver exists.
pub fn solve_json(_request_json: &str) -> String {
    let out = SolvePlaceholder {
        status: "ok",
        note: "solver stub: branch-and-bound lands in Phase 3",
    };
    serde_json::to_string(&out)
        .unwrap_or_else(|e| format!("{{\"status\":\"error\",\"note\":\"{e}\"}}"))
}

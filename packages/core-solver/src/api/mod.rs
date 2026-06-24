//! WASM boundary. The ONLY module that touches `wasm-bindgen`.
//! Serialization lives here; the core stays free of it.

use wasm_bindgen::prelude::*;

/// Runs once on module load. Installs the panic hook so a WASM panic prints a
/// readable stack instead of "unreachable", and wires up logging.
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    crate::logging::init();
}

/// Phase-0 handshake: proves the TS -> WASM pipeline works end to end.
#[wasm_bindgen]
pub fn greet() -> String {
    format!("core-solver v{} ready", crate::VERSION)
}

/// Solver entry point. Takes a JSON request, returns a JSON result.
/// Real branch-and-bound lands in Phase 3; today it returns a structured stub.
#[wasm_bindgen]
pub fn solve(request_json: &str) -> String {
    crate::solver::solve_json(request_json)
}

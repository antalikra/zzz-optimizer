//! Logging setup. The hot loop stays log-free (see docs/SOLVER.md); detailed
//! per-node tracing is gated behind the `trace-solver` feature. A full tracing
//! subscriber + JS bridge is wired up in Phase 3 when the solver needs it.

/// Initialize logging. No-op for now; kept as the stable entry point so `api::init`
/// already calls it from Phase 0.
pub fn init() {}

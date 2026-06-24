//! Phase-0 smoke tests. Real golden/property tests arrive with the solver (Phase 3).

#[test]
fn version_is_present() {
    assert!(!core_solver::VERSION.is_empty());
}

#[test]
fn solve_stub_returns_json_with_status() {
    let out = core_solver::solver::solve_json("{}");
    assert!(out.contains("\"status\""));
}

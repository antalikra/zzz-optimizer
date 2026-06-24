//! Branch-and-bound solver. See docs/SOLVER.md.
//! Invariants: monotonicity-sign bound, dominance over objective ∪ constraint
//! stats within a set-combo, no allocation / no logging in the hot loop.

pub mod brute;
pub mod json;
pub mod model;
pub mod search;

pub use json::solve_json;
pub use model::{BuildResult, Constraint, Disc, Objective};
pub use search::{solve, solve_with};

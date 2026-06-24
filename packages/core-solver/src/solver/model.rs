//! Solver data model.
//!
//! Discs store stats as fixed-point integers (scale ×1000) — e.g. CRIT Rate 2.4%
//! is stored as the fraction 0.024 × 1000 = `24`. This is exact (no float drift),
//! compact (cache-dense for the hot loop), and lets dominance compare discs with
//! exact integer ordering. The nonlinear damage formula stays in `f64`: a build's
//! assembled total is converted to `Stats` once per leaf (see `to_stats`).

use crate::domain::{Stat, Stats, STAT_COUNT};

/// Fixed-point scale: stored integer = value × 1000.
pub const FP_SCALE: f64 = 1000.0;

#[inline]
pub fn fp_to_f64(v: i32) -> f64 {
    v as f64 / FP_SCALE
}

#[inline]
pub fn fp_from_f64(v: f64) -> i32 {
    (v * FP_SCALE).round() as i32
}

/// A candidate Drive Disc. Stat values are fixed-point (see module note).
#[derive(Clone, Debug)]
pub struct Disc {
    pub id: u32,
    pub set: u16,
    pub slot: u8, // 1..=6
    pub main: (Stat, i32),
    pub subs: Vec<(Stat, i32)>,
}

impl Disc {
    /// This disc's fixed-point contribution to a single stat (main + subs).
    pub fn contribution(&self, stat: Stat) -> i32 {
        let mut v = 0;
        if self.main.0 == stat {
            v += self.main.1;
        }
        for &(s, x) in &self.subs {
            if s == stat {
                v += x;
            }
        }
        v
    }

    /// Add (`sign = 1`) or remove (`sign = -1`) this disc from an accumulator.
    pub fn apply(&self, acc: &mut [i32; STAT_COUNT], sign: i32) {
        acc[self.main.0.index()] += sign * self.main.1;
        for &(s, x) in &self.subs {
            acc[s.index()] += sign * x;
        }
    }
}

/// A minimum-threshold constraint (`stat >= min`). Phase 3 supports min-only;
/// max constraints are deferred (they reverse the dominance direction).
#[derive(Clone, Copy, Debug)]
pub struct Constraint {
    pub stat: Stat,
    pub min: f64,
}

/// The optimization objective: a score function plus the stats it depends on
/// (used by dominance and the bound). The score MUST be monotonically
/// non-decreasing in each relevant stat (the bound substitutes per-slot maxima).
pub struct Objective {
    pub relevant: Vec<Stat>,
    pub score: Box<dyn Fn(&Stats) -> f64>,
}

/// One result build: the chosen disc ids and the achieved score.
#[derive(Clone, Debug, PartialEq)]
pub struct BuildResult {
    pub disc_ids: Vec<u32>,
    pub score: f64,
}

/// Convert a fixed-point accumulator into an `f64` `Stats` context for the formula.
pub fn to_stats(fp: &[i32; STAT_COUNT]) -> Stats {
    let mut s = Stats::new();
    for stat in Stat::ALL {
        s.set(stat, fp_to_f64(fp[stat.index()]));
    }
    s
}

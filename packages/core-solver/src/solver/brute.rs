//! Reference brute force — exhaustive enumeration with no pruning. Exists so the
//! tests can assert the branch-and-bound search returns the same top-N scores.

use super::model::{fp_from_f64, to_stats, BuildResult, Constraint, Disc, Objective};
use crate::domain::STAT_COUNT;

#[allow(clippy::too_many_arguments)]
fn rec(
    slots: &[Vec<&Disc>; 6],
    d: usize,
    prefix: &mut [i32; STAT_COUNT],
    ids: &mut Vec<u32>,
    objective: &Objective,
    constraints: &[Constraint],
    out: &mut Vec<BuildResult>,
) {
    if d == 6 {
        if constraints
            .iter()
            .all(|c| prefix[c.stat.index()] >= fp_from_f64(c.min))
        {
            let score = (objective.score)(&to_stats(prefix));
            out.push(BuildResult { disc_ids: ids.clone(), score });
        }
        return;
    }
    for cand in &slots[d] {
        cand.apply(prefix, 1);
        ids.push(cand.id);
        rec(slots, d + 1, prefix, ids, objective, constraints, out);
        ids.pop();
        cand.apply(prefix, -1);
    }
}

/// Exhaustively enumerate every build, returning the `top_n` by score (descending).
pub fn brute_force(
    discs: &[Disc],
    base: &[i32; STAT_COUNT],
    objective: &Objective,
    constraints: &[Constraint],
    top_n: usize,
) -> Vec<BuildResult> {
    if top_n == 0 {
        return Vec::new();
    }
    let mut slots: [Vec<&Disc>; 6] = Default::default();
    for d in discs {
        if (1..=6).contains(&d.slot) {
            slots[(d.slot - 1) as usize].push(d);
        }
    }
    if slots.iter().any(|s| s.is_empty()) {
        return Vec::new();
    }

    let mut all = Vec::new();
    let mut prefix = *base;
    let mut ids = Vec::with_capacity(6);
    rec(&slots, 0, &mut prefix, &mut ids, objective, constraints, &mut all);

    all.sort_by(|a, b| b.score.total_cmp(&a.score));
    all.truncate(top_n);
    all
}

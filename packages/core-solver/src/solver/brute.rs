//! Reference brute force — exhaustive enumeration with no pruning, including set
//! bonuses. Exists so the tests can assert the B&B search returns the same top-N.

use std::collections::HashMap;

use super::model::{
    apply_set_bonuses, fp_from_f64, to_stats, BuildResult, Constraint, Disc, Objective, SetBonuses,
};
use crate::domain::STAT_COUNT;

struct Rec<'a> {
    slots: &'a [Vec<&'a Disc>; 6],
    objective: &'a Objective,
    constraints: &'a [Constraint],
    bonuses: &'a SetBonuses,
    out: &'a mut Vec<BuildResult>,
}

fn rec(
    r: &mut Rec,
    d: usize,
    prefix: &mut [i32; STAT_COUNT],
    set_counts: &mut HashMap<u16, u8>,
    ids: &mut Vec<u32>,
) {
    if d == 6 {
        let mut total = *prefix;
        apply_set_bonuses(&mut total, set_counts, r.bonuses);
        if r
            .constraints
            .iter()
            .all(|c| total[c.stat.index()] >= fp_from_f64(c.min))
        {
            let score = (r.objective.score)(&to_stats(&total));
            r.out.push(BuildResult { disc_ids: ids.clone(), score });
        }
        return;
    }
    for cand in &r.slots[d] {
        cand.apply(prefix, 1);
        *set_counts.entry(cand.set).or_insert(0) += 1;
        ids.push(cand.id);
        rec(r, d + 1, prefix, set_counts, ids);
        ids.pop();
        if let Some(c) = set_counts.get_mut(&cand.set) {
            *c -= 1;
        }
        cand.apply(prefix, -1);
    }
}

/// Exhaustively enumerate every build, returning the `top_n` by score (descending).
pub fn brute_force(
    discs: &[Disc],
    base: &[i32; STAT_COUNT],
    objective: &Objective,
    constraints: &[Constraint],
    bonuses: &SetBonuses,
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
    let mut set_counts = HashMap::new();
    let mut ids = Vec::with_capacity(6);
    {
        let mut r = Rec { slots: &slots, objective, constraints, bonuses, out: &mut all };
        rec(&mut r, 0, &mut prefix, &mut set_counts, &mut ids);
    }

    all.sort_by(|a, b| b.score.total_cmp(&a.score));
    all.truncate(top_n);
    all
}

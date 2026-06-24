//! Branch-and-bound search: dominance prune + monotonic upper bound + top-N heap.
//! See docs/SOLVER.md. The reference brute force in `super::brute` exists so the
//! property tests can assert this produces the same top-N scores.

use std::cmp::Reverse;
use std::collections::BinaryHeap;

use super::model::{fp_from_f64, to_stats, BuildResult, Constraint, Disc, Objective};
use crate::domain::{Stat, STAT_COUNT};

/// Heap entry ordered by score (NaN-safe via `total_cmp`).
struct Scored {
    score: f64,
    ids: Vec<u32>,
}
impl PartialEq for Scored {
    fn eq(&self, o: &Self) -> bool {
        self.score.total_cmp(&o.score).is_eq()
    }
}
impl Eq for Scored {}
impl PartialOrd for Scored {
    fn partial_cmp(&self, o: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(o))
    }
}
impl Ord for Scored {
    fn cmp(&self, o: &Self) -> std::cmp::Ordering {
        self.score.total_cmp(&o.score)
    }
}

/// Group discs into the six slots (index = slot - 1). Returns `None` if any slot
/// has no candidate (then no complete build exists).
fn group_by_slot(discs: &[Disc]) -> Option<[Vec<Disc>; 6]> {
    let mut slots: [Vec<Disc>; 6] = Default::default();
    for d in discs {
        if (1..=6).contains(&d.slot) {
            slots[(d.slot - 1) as usize].push(d.clone());
        }
    }
    if slots.iter().any(|s| s.is_empty()) {
        return None;
    }
    Some(slots)
}

/// Strict-Pareto dominance prune within one slot's candidates, over `dom_stats`
/// (objective ∪ constraint stats). Drops a disc only if another is >= on every
/// dom stat and strictly > on at least one — so equal discs are both kept and
/// the top-N score multiset is preserved.
fn prune_dominated(cands: &[Disc], dom_stats: &[Stat]) -> Vec<Disc> {
    let vecs: Vec<Vec<i32>> = cands
        .iter()
        .map(|d| dom_stats.iter().map(|&s| d.contribution(s)).collect())
        .collect();

    let mut keep = Vec::new();
    for (i, di) in cands.iter().enumerate() {
        let dominated = cands.iter().enumerate().any(|(j, _)| {
            if i == j {
                return false;
            }
            let ge_all = vecs[j].iter().zip(&vecs[i]).all(|(bj, bi)| bj >= bi);
            let gt_any = vecs[j].iter().zip(&vecs[i]).any(|(bj, bi)| bj > bi);
            ge_all && gt_any
        });
        if !dominated {
            keep.push(di.clone());
        }
    }
    keep
}

struct Ctx<'a> {
    ordered: Vec<usize>,
    cands: [Vec<Disc>; 6],
    suffix: Vec<[i32; STAT_COUNT]>, // suffix[d] = sum of per-slot maxima for ordered slots d..end
    objective: &'a Objective,
    constraints: &'a [Constraint],
    top_n: usize,
}

struct State {
    heap: BinaryHeap<Reverse<Scored>>,
    prefix: [i32; STAT_COUNT],
    chosen: Vec<u32>,
}

impl State {
    fn heap_min(&self) -> Option<f64> {
        self.heap.peek().map(|Reverse(s)| s.score)
    }

    fn offer(&mut self, top_n: usize, score: f64, ids: Vec<u32>) {
        if self.heap.len() < top_n {
            self.heap.push(Reverse(Scored { score, ids }));
        } else if let Some(min) = self.heap_min() {
            if score > min {
                self.heap.pop();
                self.heap.push(Reverse(Scored { score, ids }));
            }
        }
    }
}

fn feasible_upper(b: &[i32; STAT_COUNT], constraints: &[Constraint]) -> bool {
    // b holds the MAX achievable per stat for the subtree; if a min can't be
    // reached even here, no completion satisfies it.
    constraints
        .iter()
        .all(|c| b[c.stat.index()] >= fp_from_f64(c.min))
}

fn dfs(ctx: &Ctx, st: &mut State, d: usize) {
    if d == ctx.ordered.len() {
        // Leaf: prefix now holds the full build total.
        if !ctx
            .constraints
            .iter()
            .all(|c| st.prefix[c.stat.index()] >= fp_from_f64(c.min))
        {
            return;
        }
        let score = (ctx.objective.score)(&to_stats(&st.prefix));
        let ids = st.chosen.clone();
        st.offer(ctx.top_n, score, ids);
        return;
    }

    // Optimistic completion: prefix + max remaining per stat.
    let mut b = st.prefix;
    for (i, bi) in b.iter_mut().enumerate() {
        *bi += ctx.suffix[d][i];
    }
    if !feasible_upper(&b, ctx.constraints) {
        return;
    }
    if st.heap.len() == ctx.top_n {
        if let Some(thr) = st.heap_min() {
            let bound = (ctx.objective.score)(&to_stats(&b));
            if bound <= thr {
                return; // no completion can enter the top-N
            }
        }
    }

    let slot = ctx.ordered[d];
    for cand in &ctx.cands[slot] {
        cand.apply(&mut st.prefix, 1);
        st.chosen.push(cand.id);
        dfs(ctx, st, d + 1);
        st.chosen.pop();
        cand.apply(&mut st.prefix, -1);
    }
}

/// Solve: return up to `top_n` best builds (sorted by score descending).
///
/// `base` is the fixed-point constant stat contribution (agent base + W-Engine +
/// buffs); disc contributions are added on top. See docs/SOLVER.md for invariants.
pub fn solve(
    discs: &[Disc],
    base: &[i32; STAT_COUNT],
    objective: &Objective,
    constraints: &[Constraint],
    top_n: usize,
) -> Vec<BuildResult> {
    solve_with(discs, base, objective, constraints, top_n, true)
}

/// Like [`solve`], but `use_dominance` can disable the dominance prune.
///
/// Dominance preserves the optimum (top-1) but may drop strictly-worse builds
/// that would occupy lower top-N ranks, so the full top-N score list only matches
/// brute force when dominance is OFF. Both modes are exercised by the tests.
pub fn solve_with(
    discs: &[Disc],
    base: &[i32; STAT_COUNT],
    objective: &Objective,
    constraints: &[Constraint],
    top_n: usize,
    use_dominance: bool,
) -> Vec<BuildResult> {
    if top_n == 0 {
        return Vec::new();
    }
    let Some(mut cands) = group_by_slot(discs) else {
        return Vec::new();
    };

    if use_dominance {
        // Dominance prune each slot over objective ∪ constraint stats.
        let mut dom_stats = objective.relevant.clone();
        for c in constraints {
            if !dom_stats.contains(&c.stat) {
                dom_stats.push(c.stat);
            }
        }
        for slot in &mut cands {
            *slot = prune_dominated(slot, &dom_stats);
        }
    }

    // Per-slot per-stat maxima (fixed-point), for the bound.
    let mut slot_max = [[0i32; STAT_COUNT]; 6];
    for (si, slot) in cands.iter().enumerate() {
        for stat in Stat::ALL {
            let m = slot
                .iter()
                .map(|d| d.contribution(stat))
                .max()
                .unwrap_or(0);
            slot_max[si][stat.index()] = m;
        }
    }

    // DFS slot order: fewest candidates first (fail-first pruning).
    let mut ordered: Vec<usize> = (0..6).collect();
    ordered.sort_by_key(|&s| cands[s].len());

    // Suffix sums of slot maxima along the ordered list.
    let n = ordered.len();
    let mut suffix = vec![[0i32; STAT_COUNT]; n + 1];
    for d in (0..n).rev() {
        let slot = ordered[d];
        for i in 0..STAT_COUNT {
            suffix[d][i] = suffix[d + 1][i] + slot_max[slot][i];
        }
    }

    let ctx = Ctx {
        ordered,
        cands,
        suffix,
        objective,
        constraints,
        top_n,
    };
    let mut st = State {
        heap: BinaryHeap::new(),
        prefix: *base,
        chosen: Vec::with_capacity(6),
    };
    dfs(&ctx, &mut st, 0);

    let mut out: Vec<BuildResult> = st
        .heap
        .into_iter()
        .map(|Reverse(s)| BuildResult { disc_ids: s.ids, score: s.score })
        .collect();
    out.sort_by(|a, b| b.score.total_cmp(&a.score));
    out
}

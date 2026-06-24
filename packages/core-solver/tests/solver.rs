//! Phase-3/3.5 solver correctness: branch-and-bound must agree with the exhaustive
//! brute force, including 2-piece set bonuses. A deterministic xorshift RNG drives
//! many random small inventories (a property test without extra dependencies).
//!
//! - Dominance OFF: full top-N score list must equal brute force.
//! - Dominance ON: the optimum (top-1) must equal brute force.

use core_solver::domain::{Stat, Stats, STAT_COUNT};
use core_solver::solver::brute::brute_force;
use core_solver::solver::model::Disc;
use core_solver::solver::{solve, solve_with, BuildResult, Constraint, Objective, SetBonuses};

const UNIVERSE: [Stat; 5] = [
    Stat::AtkPct,
    Stat::Atk,
    Stat::CritRate,
    Stat::CritDmg,
    Stat::IceDmg,
];

struct Rng(u64);
impl Rng {
    fn new(seed: u64) -> Self {
        Self(seed | 1)
    }
    fn next(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        x
    }
    fn below(&mut self, n: u32) -> u32 {
        (self.next() % n as u64) as u32
    }
}

fn rand_disc(rng: &mut Rng, id: u32, slot: u8) -> Disc {
    let main_stat = UNIVERSE[rng.below(UNIVERSE.len() as u32) as usize];
    let main_val = (rng.below(300) + 1) as i32;
    let n_subs = rng.below(4);
    let mut subs = Vec::new();
    for _ in 0..n_subs {
        let s = UNIVERSE[rng.below(UNIVERSE.len() as u32) as usize];
        let v = (rng.below(100) + 1) as i32;
        subs.push((s, v));
    }
    Disc {
        id,
        set: rng.below(2) as u16, // two sets, so 2pc bonuses can trigger
        slot,
        main: (main_stat, main_val),
        subs,
    }
}

fn rand_inventory(rng: &mut Rng) -> Vec<Disc> {
    let mut discs = Vec::new();
    let mut id = 0;
    for slot in 1..=6u8 {
        let count = rng.below(3) + 1;
        for _ in 0..count {
            discs.push(rand_disc(rng, id, slot));
            id += 1;
        }
    }
    discs
}

fn weighted_objective() -> Objective {
    Objective {
        relevant: UNIVERSE.to_vec(),
        score: Box::new(|s: &Stats| {
            2000.0 * s.get(Stat::CritRate)
                + 1500.0 * s.get(Stat::CritDmg)
                + 1000.0 * s.get(Stat::AtkPct)
                + 1.0 * s.get(Stat::Atk)
                + 1000.0 * s.get(Stat::IceDmg)
        }),
    }
}

fn base() -> [i32; STAT_COUNT] {
    let mut b = [0i32; STAT_COUNT];
    b[Stat::CritRate.index()] = 50; // 0.05
    b[Stat::CritDmg.index()] = 500; // 0.50
    b
}

fn no_bonuses() -> SetBonuses {
    SetBonuses::new()
}

fn sample_bonuses() -> SetBonuses {
    let mut b = SetBonuses::new();
    b.set_two_piece(0, Stat::AtkPct, 100); // +0.10 AtkPct (fixed-point x1000)
    b.set_two_piece(1, Stat::CritRate, 80); // +0.08 CRIT Rate
    b
}

fn assert_scores_eq(a: &[BuildResult], b: &[BuildResult]) {
    assert_eq!(a.len(), b.len(), "result count differs");
    for (x, y) in a.iter().zip(b) {
        assert!((x.score - y.score).abs() < 1e-6, "score {} vs {}", x.score, y.score);
    }
}

#[test]
fn single_candidate_per_slot_is_deterministic() {
    let obj = weighted_objective();
    let b = base();
    let mut discs = Vec::new();
    for slot in 1..=6u8 {
        discs.push(Disc {
            id: slot as u32,
            set: 0,
            slot,
            main: (Stat::AtkPct, 100),
            subs: vec![(Stat::CritRate, 20)],
        });
    }
    let res = solve(&discs, &b, &obj, &[], &no_bonuses(), 3);
    assert_eq!(res.len(), 1, "only one build is possible");
    // AtkPct 0.6 -> 600 ; CR (0.05 + 6*0.02 = 0.17) -> 340 ; CD 0.5 -> 750 ; total 1690
    assert!((res[0].score - 1690.0).abs() < 1e-6, "got {}", res[0].score);
}

#[test]
fn bnb_topn_matches_brute_without_dominance() {
    let mut rng = Rng::new(0xDEAD_BEEF);
    let obj = weighted_objective();
    let b = base();
    for _ in 0..400 {
        let inv = rand_inventory(&mut rng);
        let bnb = solve_with(&inv, &b, &obj, &[], &no_bonuses(), 5, false);
        let bf = brute_force(&inv, &b, &obj, &[], &no_bonuses(), 5);
        assert_scores_eq(&bnb, &bf);
    }
}

#[test]
fn bnb_top1_matches_brute_with_dominance() {
    let mut rng = Rng::new(0x1234_5678);
    let obj = weighted_objective();
    let b = base();
    for _ in 0..400 {
        let inv = rand_inventory(&mut rng);
        let bnb = solve(&inv, &b, &obj, &[], &no_bonuses(), 1);
        let bf = brute_force(&inv, &b, &obj, &[], &no_bonuses(), 1);
        assert_scores_eq(&bnb, &bf);
    }
}

#[test]
fn constraints_respected_match_brute() {
    let mut rng = Rng::new(0x0BAD_F00D);
    let obj = weighted_objective();
    let b = base();
    let cons = [Constraint { stat: Stat::CritRate, min: 0.4 }];
    for _ in 0..400 {
        let inv = rand_inventory(&mut rng);
        let bnb = solve_with(&inv, &b, &obj, &cons, &no_bonuses(), 5, false);
        let bf = brute_force(&inv, &b, &obj, &cons, &no_bonuses(), 5);
        assert_scores_eq(&bnb, &bf);
    }
}

#[test]
fn bnb_topn_with_set_bonuses_matches_brute() {
    let mut rng = Rng::new(0x5E7B_0AC5);
    let obj = weighted_objective();
    let b = base();
    let bonuses = sample_bonuses();
    for _ in 0..400 {
        let inv = rand_inventory(&mut rng);
        let bnb = solve_with(&inv, &b, &obj, &[], &bonuses, 5, false);
        let bf = brute_force(&inv, &b, &obj, &[], &bonuses, 5);
        assert_scores_eq(&bnb, &bf);
    }
}

#[test]
fn bnb_top1_with_set_bonuses_matches_brute() {
    let mut rng = Rng::new(0x5E7B_0AC6);
    let obj = weighted_objective();
    let b = base();
    let bonuses = sample_bonuses();
    for _ in 0..400 {
        let inv = rand_inventory(&mut rng);
        let bnb = solve(&inv, &b, &obj, &[], &bonuses, 1);
        let bf = brute_force(&inv, &b, &obj, &[], &bonuses, 1);
        assert_scores_eq(&bnb, &bf);
    }
}

#[test]
fn ellen_formula_objective_top1_matches_brute() {
    use core_solver::formula::library::{ellen_basic_hit, Enemy};
    use core_solver::formula::Dag;

    let mut dag = Dag::new();
    let root = ellen_basic_hit(
        &mut dag,
        2000.0,
        1.5,
        Enemy { def: 1000.0, level_factor: 800.0, res_mult: 0.9 },
    );
    let obj = Objective {
        relevant: vec![
            Stat::AtkPct,
            Stat::Atk,
            Stat::IceDmg,
            Stat::CritRate,
            Stat::CritDmg,
            Stat::PenRatio,
            Stat::Pen,
        ],
        score: Box::new(move |s: &Stats| dag.eval(root, s)),
    };
    let b = base();
    let mut rng = Rng::new(0xCAFE_2025);
    for _ in 0..200 {
        let inv = rand_inventory(&mut rng);
        let bnb = solve(&inv, &b, &obj, &[], &no_bonuses(), 1);
        let bf = brute_force(&inv, &b, &obj, &[], &no_bonuses(), 1);
        assert_scores_eq(&bnb, &bf);
    }
}

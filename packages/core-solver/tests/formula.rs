//! Phase-2 formula engine tests: a hand-computed golden value, the monotonicity
//! the solver bound depends on, the CRIT cap, and the data<->domain stat binding.

use core_solver::domain::{Stat, Stats, STAT_COUNT};
use core_solver::formula::library::{ellen_basic_hit, Enemy};
use core_solver::formula::Dag;
use std::str::FromStr;

const BASE_ATK: f64 = 2000.0;
const SKILL_MV: f64 = 1.5;

fn enemy() -> Enemy {
    Enemy { def: 1000.0, level_factor: 800.0, res_mult: 0.9 }
}

/// Representative total stats (percentages as fractions; see domain::stat).
fn base_stats() -> Stats {
    Stats::new()
        .with(Stat::AtkPct, 0.5)
        .with(Stat::Atk, 300.0)
        .with(Stat::IceDmg, 0.20)
        .with(Stat::CritRate, 0.7)
        .with(Stat::CritDmg, 1.5)
        .with(Stat::PenRatio, 0.10)
        .with(Stat::Pen, 50.0)
}

fn build() -> (Dag, usize) {
    let mut dag = Dag::new();
    let root = ellen_basic_hit(&mut dag, BASE_ATK, SKILL_MV, enemy());
    (dag, root)
}

#[test]
fn golden_single_hit() {
    // Hand computation (independent of the DAG wiring):
    //   ATK       = 2000*(1+0.5)+300            = 3300
    //   base_hit  = 3300*1.5                    = 4950
    //   after Ice = 4950*(1+0.20)               = 5940
    //   crit      = 1 + min(1,0.7)*1.5          = 2.05
    //   after CR  = 5940*2.05                   = 12177
    //   effDef    = max(0, 1000*(1-0.10) - 50)  = 850
    //   defMult   = 800/(800+850)               = 0.484848...
    //   after Def = 12177 * 800/1650            = 5904
    //   after RES = 5904 * 0.9                  = 5313.6
    let (dag, root) = build();
    let got = dag.eval(root, &base_stats());
    assert!((got - 5313.6).abs() < 1e-6, "expected 5313.6, got {got}");
}

#[test]
fn monotonic_increasing_in_key_stats() {
    let (dag, root) = build();
    let base = dag.eval(root, &base_stats());
    // Each of these stats must strictly increase damage — the solver's upper
    // bound substitutes their per-slot MAX, which is only valid if monotone up.
    let bumps = [
        (Stat::AtkPct, 0.1),
        (Stat::Atk, 50.0),
        (Stat::IceDmg, 0.1),
        (Stat::CritRate, 0.05),
        (Stat::CritDmg, 0.1),
        (Stat::PenRatio, 0.05),
        (Stat::Pen, 50.0),
    ];
    for (stat, delta) in bumps {
        let mut s = base_stats();
        s.add(stat, delta);
        let bumped = dag.eval(root, &s);
        assert!(bumped > base, "{:?} should increase damage: {base} -> {bumped}", stat);
    }
}

#[test]
fn crit_rate_caps_at_100_percent() {
    let (dag, root) = build();
    let at_100 = dag.eval(root, &base_stats().with(Stat::CritRate, 1.0));
    let at_150 = dag.eval(root, &base_stats().with(Stat::CritRate, 1.5));
    assert!((at_100 - at_150).abs() < 1e-9, "CR past 100% must not add damage");
}

#[test]
fn stat_enum_indices_are_dense_and_stable() {
    assert_eq!(Stat::ALL.len(), STAT_COUNT);
    for (i, stat) in Stat::ALL.into_iter().enumerate() {
        assert_eq!(stat.index(), i);
        assert_eq!(Stat::from_str(stat.id()), Ok(stat), "id round-trip for {:?}", stat);
    }
    assert_eq!(Stat::from_str("NotAStat"), Err(()));
}

#[test]
fn game_data_stat_ids_map_to_domain() {
    // Every stat id used in the game-data files must bind to a domain Stat.
    for id in [
        "Hp", "Atk", "Def", "AtkPct", "HpPct", "DefPct", "CritRate", "CritDmg",
        "PenRatio", "Pen", "AnomalyProficiency", "AnomalyMastery", "Impact",
        "EnergyRegen", "IceDmg", "FireDmg", "PhysicalDmg", "ElectricDmg", "EtherDmg",
    ] {
        assert!(Stat::from_str(id).is_ok(), "game-data stat id '{id}' has no domain Stat");
    }
}

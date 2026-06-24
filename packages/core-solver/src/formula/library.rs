//! Concrete damage formulas. Phase 2 ships one agent (Ellen Joe). Formulas are
//! built in code here; data-driven formula loading comes in a later phase.

use super::{Dag, NodeId};
use crate::domain::Stat;

/// Fixed enemy/target parameters for a damage calculation. These are constant
/// w.r.t. the discs being optimized, so they bake into the DAG as constants.
#[derive(Debug, Clone, Copy)]
pub struct Enemy {
    /// Enemy DEF value.
    pub def: f64,
    /// Attacker-level scaling constant in the DEF mitigation formula.
    pub level_factor: f64,
    /// Precomputed resistance multiplier for this enemy: `(1 - RES% + RES_PEN%)`.
    pub res_mult: f64,
}

/// Build a single-hit Ellen damage formula and return its root node id.
///
/// - `base_atk` = agent base ATK + W-Engine base ATK (build-constant).
/// - `skill_mv` = skill motion value (e.g. `1.5` for 150%).
///
/// Everything else (ATK%, flat ATK, CRIT, Ice DMG, PEN) is read from the stat
/// context, in FRACTION units for percentages (see `domain::stat` unit note).
///
/// ```text
/// DMG     = ATK * skill_mv * (1 + IceDmg) * (1 + min(1,CR)*CD) * defMult * resMult
/// ATK     = base_atk * (1 + AtkPct) + Atk
/// defMult = level_factor / (level_factor + max(0, def*(1 - PenRatio) - Pen))
/// ```
pub fn ellen_basic_hit(dag: &mut Dag, base_atk: f64, skill_mv: f64, enemy: Enemy) -> NodeId {
    let one = dag.constant(1.0);

    // ATK = base_atk * (1 + AtkPct) + Atk(flat)
    let base = dag.constant(base_atk);
    let atk_pct = dag.stat(Stat::AtkPct);
    let one_plus_atk_pct = dag.add(one, atk_pct);
    let scaled = dag.mul(base, one_plus_atk_pct);
    let flat_atk = dag.stat(Stat::Atk);
    let atk = dag.add(scaled, flat_atk);

    // base hit = ATK * skill_mv
    let mv = dag.constant(skill_mv);
    let base_hit = dag.mul(atk, mv);

    // DMG bonus bucket = (1 + IceDmg)
    let ice = dag.stat(Stat::IceDmg);
    let dmg_bonus = dag.add(one, ice);
    let after_bonus = dag.mul(base_hit, dmg_bonus);

    // crit = 1 + min(1, CR) * CD
    let cr = dag.stat(Stat::CritRate);
    let cr_capped = dag.min(one, cr);
    let cd = dag.stat(Stat::CritDmg);
    let cr_cd = dag.mul(cr_capped, cd);
    let crit = dag.add(one, cr_cd);
    let after_crit = dag.mul(after_bonus, crit);

    // defMult = lf / (lf + max(0, def*(1 - PenRatio) - Pen))
    let lf = dag.constant(enemy.level_factor);
    let def = dag.constant(enemy.def);
    let pen_ratio = dag.stat(Stat::PenRatio);
    let one_minus_pr = dag.sub(one, pen_ratio);
    let def_after_ratio = dag.mul(def, one_minus_pr);
    let pen = dag.stat(Stat::Pen);
    let eff_def_raw = dag.sub(def_after_ratio, pen);
    let zero = dag.constant(0.0);
    let eff_def = dag.max(zero, eff_def_raw);
    let denom = dag.add(lf, eff_def);
    let def_mult = dag.div(lf, denom);
    let after_def = dag.mul(after_crit, def_mult);

    // resMult (enemy constant)
    let res = dag.constant(enemy.res_mult);
    dag.mul(after_def, res)
}

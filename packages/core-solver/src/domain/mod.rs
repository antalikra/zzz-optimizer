//! Domain types — the source of truth, exported to TS via ts-rs in Phase 2.
//! Types only: no algorithms, no I/O. See docs/DATA-MODEL.md.

/// Stat identifiers. ZZZ-specific (not the Genshin set); grows in Phase 2.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Stat {
    Hp,
    HpPct,
    Atk,
    AtkPct,
    Def,
    DefPct,
    CritRate,
    CritDmg,
    Pen,
    PenRatio,
    AnomalyProficiency,
    AnomalyMastery,
    Impact,
    EnergyRegen,
    SheerForce,
}

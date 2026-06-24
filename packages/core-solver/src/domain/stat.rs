//! Stat identifiers and the dense stat vector.
//!
//! Unit convention (IMPORTANT): percentage stats are stored as FRACTIONS in a
//! `Stats` context — CRIT Rate 5% is `0.05`, Ice DMG 10% is `0.10`, ATK% as a
//! fraction. Flat stats (Atk, Hp, Def, Pen, Anomaly Proficiency, Impact) are raw.
//! Game-data files use percent units; the conversion happens when assembling a
//! `Stats` from data (later phase). Mixing the two is a 100x bug — keep it here.

use std::str::FromStr;

/// ZZZ stat ids (flat enum so a `Stats` can be a dense array). Matches the
/// string ids used in the game-data JSON via [`Stat::id`] / `FromStr`.
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
    PhysicalDmg,
    FireDmg,
    IceDmg,
    ElectricDmg,
    EtherDmg,
}

/// Number of `Stat` variants. Keep in sync with the enum (asserted in tests).
pub const STAT_COUNT: usize = 20;

impl Stat {
    /// All variants in declaration order (index order).
    pub const ALL: [Stat; STAT_COUNT] = [
        Stat::Hp,
        Stat::HpPct,
        Stat::Atk,
        Stat::AtkPct,
        Stat::Def,
        Stat::DefPct,
        Stat::CritRate,
        Stat::CritDmg,
        Stat::Pen,
        Stat::PenRatio,
        Stat::AnomalyProficiency,
        Stat::AnomalyMastery,
        Stat::Impact,
        Stat::EnergyRegen,
        Stat::SheerForce,
        Stat::PhysicalDmg,
        Stat::FireDmg,
        Stat::IceDmg,
        Stat::ElectricDmg,
        Stat::EtherDmg,
    ];

    /// Dense index into a [`Stats`] vector.
    pub fn index(self) -> usize {
        self as usize
    }

    /// Stable string id, matching the game-data JSON stat strings.
    pub fn id(self) -> &'static str {
        match self {
            Stat::Hp => "Hp",
            Stat::HpPct => "HpPct",
            Stat::Atk => "Atk",
            Stat::AtkPct => "AtkPct",
            Stat::Def => "Def",
            Stat::DefPct => "DefPct",
            Stat::CritRate => "CritRate",
            Stat::CritDmg => "CritDmg",
            Stat::Pen => "Pen",
            Stat::PenRatio => "PenRatio",
            Stat::AnomalyProficiency => "AnomalyProficiency",
            Stat::AnomalyMastery => "AnomalyMastery",
            Stat::Impact => "Impact",
            Stat::EnergyRegen => "EnergyRegen",
            Stat::SheerForce => "SheerForce",
            Stat::PhysicalDmg => "PhysicalDmg",
            Stat::FireDmg => "FireDmg",
            Stat::IceDmg => "IceDmg",
            Stat::ElectricDmg => "ElectricDmg",
            Stat::EtherDmg => "EtherDmg",
        }
    }
}

impl FromStr for Stat {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Stat::ALL.into_iter().find(|st| st.id() == s).ok_or(())
    }
}

/// Dense stat vector indexed by [`Stat`] — cache-friendly (SoA), no hashing in
/// the hot path. Holds the assembled TOTAL stats for a build (see unit note above).
#[derive(Debug, Clone, PartialEq)]
pub struct Stats {
    values: [f64; STAT_COUNT],
}

impl Default for Stats {
    fn default() -> Self {
        Self { values: [0.0; STAT_COUNT] }
    }
}

impl Stats {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get(&self, stat: Stat) -> f64 {
        self.values[stat.index()]
    }

    pub fn set(&mut self, stat: Stat, v: f64) {
        self.values[stat.index()] = v;
    }

    pub fn add(&mut self, stat: Stat, v: f64) {
        self.values[stat.index()] += v;
    }

    /// Builder-style setter for terse construction.
    pub fn with(mut self, stat: Stat, v: f64) -> Self {
        self.set(stat, v);
        self
    }
}

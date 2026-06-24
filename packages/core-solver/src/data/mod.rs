//! Input parsing & validation for static game data and solver requests.
//!
//! Phase 1: typed deserialization of the static game-data JSON — the solver-side
//! contract that complements the JSON-schema validation done at load time.
//! Stat references are raw strings here; they are mapped to typed `domain::Stat`
//! by the formula engine in Phase 2. See docs/DATA-MODEL.md.

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BaseStats {
    pub hp: f64,
    pub atk: f64,
    pub def: f64,
    pub crit_rate: f64,
    pub crit_dmg: f64,
    pub anomaly_proficiency: f64,
    pub anomaly_mastery: f64,
    pub impact: f64,
    pub energy_regen: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub rarity: String,
    pub element: String,
    pub specialty: String,
    pub faction: String,
    pub base_stats: BaseStats,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatValue {
    pub stat: String,
    pub value: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WEngine {
    pub id: String,
    pub name: String,
    pub rarity: String,
    pub base_atk: f64,
    pub advanced_stat: StatValue,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscSet {
    pub id: String,
    pub name: String,
    pub two_piece: StatValue,
}

/// Parse the agents game-data JSON into typed structs.
pub fn parse_agents(json: &str) -> serde_json::Result<Vec<Agent>> {
    serde_json::from_str(json)
}

/// Parse the W-Engines game-data JSON into typed structs.
pub fn parse_w_engines(json: &str) -> serde_json::Result<Vec<WEngine>> {
    serde_json::from_str(json)
}

/// Parse the Drive Disc sets game-data JSON into typed structs.
pub fn parse_disc_sets(json: &str) -> serde_json::Result<Vec<DiscSet>> {
    serde_json::from_str(json)
}

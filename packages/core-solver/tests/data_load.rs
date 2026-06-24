//! Phase-1: the static game-data JSON deserializes into the solver's typed structs.
//! This is the solver-side half of validation; the JSON-schema (ajv) check is the other.

use core_solver::data;

const AGENTS: &str = include_str!("../../game-data/data/v0/agents.json");
const W_ENGINES: &str = include_str!("../../game-data/data/v0/w-engines.json");
const DISC_SETS: &str = include_str!("../../game-data/data/v0/disc-sets.json");

#[test]
fn agents_parse() {
    let agents = data::parse_agents(AGENTS).expect("agents.json parses");
    assert!(!agents.is_empty());
    assert!(agents.iter().any(|a| a.id == "ellen"));
    assert!(agents.iter().all(|a| a.base_stats.atk > 0.0));
}

#[test]
fn w_engines_parse() {
    let engines = data::parse_w_engines(W_ENGINES).expect("w-engines.json parses");
    assert!(!engines.is_empty());
    assert!(engines.iter().all(|w| w.base_atk > 0.0));
}

#[test]
fn disc_sets_parse() {
    let sets = data::parse_disc_sets(DISC_SETS).expect("disc-sets.json parses");
    assert!(sets.len() >= 2);
    assert!(sets.iter().any(|s| s.id == "polar-metal"));
}

//! JSON bridge for the WASM boundary: parse a `SolveRequest`, run the solver,
//! serialize a `SolveResponse`. This is the only solver code that deals with the
//! wire format. See docs/FRONTEND.md for the worker that calls it.
//!
//! Stat values in the request are in SOLVER UNITS (fractions for percentages,
//! raw for flats) — see `domain::stat`. ZZZOD percent→fraction conversion happens
//! upstream in the TS import layer (Phase 6).

use std::collections::BTreeMap;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

use super::model::{fp_from_f64, Constraint, Disc, SetBonuses};
use super::{solve, Objective};
use crate::domain::{Stat, STAT_COUNT};
use crate::formula::library::{ellen_basic_hit, Enemy};
use crate::formula::Dag;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SolveRequest {
    objective: ObjectiveDto,
    #[serde(default)]
    base: BTreeMap<String, f64>,
    discs: Vec<DiscDto>,
    #[serde(default)]
    constraints: Vec<ConstraintDto>,
    /// set id (as string) -> 2-piece bonus. Optional.
    #[serde(default)]
    set_bonuses: BTreeMap<String, StatValueDto>,
    top_n: usize,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum ObjectiveDto {
    Weighted { weights: BTreeMap<String, f64> },
    MaxStat { stat: String },
    // Variant-level rename_all: the enum-level one only renames the variant tags,
    // not the fields inside a variant.
    #[serde(rename_all = "camelCase")]
    EllenDamage { base_atk: f64, skill_mv: f64, enemy: EnemyDto },
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EnemyDto {
    def: f64,
    level_factor: f64,
    res_mult: f64,
}

#[derive(Deserialize)]
struct StatValueDto {
    stat: String,
    value: f64,
}

#[derive(Deserialize)]
struct DiscDto {
    id: u32,
    set: u16,
    slot: u8,
    main: StatValueDto,
    subs: Vec<StatValueDto>,
}

#[derive(Deserialize)]
struct ConstraintDto {
    stat: String,
    min: f64,
}

#[derive(Serialize)]
struct BuildDto {
    #[serde(rename = "discIds")]
    disc_ids: Vec<u32>,
    score: f64,
}

#[derive(Serialize)]
struct SolveResponse {
    status: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    builds: Vec<BuildDto>,
    count: usize,
}

fn parse_stat(s: &str) -> Result<Stat, String> {
    Stat::from_str(s).map_err(|_| format!("unknown stat: {s}"))
}

fn build_base(map: &BTreeMap<String, f64>) -> Result<[i32; STAT_COUNT], String> {
    let mut b = [0i32; STAT_COUNT];
    for (k, v) in map {
        b[parse_stat(k)?.index()] = fp_from_f64(*v);
    }
    Ok(b)
}

fn build_disc(d: &DiscDto) -> Result<Disc, String> {
    let main = (parse_stat(&d.main.stat)?, fp_from_f64(d.main.value));
    let mut subs = Vec::with_capacity(d.subs.len());
    for s in &d.subs {
        subs.push((parse_stat(&s.stat)?, fp_from_f64(s.value)));
    }
    Ok(Disc { id: d.id, set: d.set, slot: d.slot, main, subs })
}

fn build_objective(o: &ObjectiveDto) -> Result<Objective, String> {
    match o {
        ObjectiveDto::MaxStat { stat } => {
            let st = parse_stat(stat)?;
            Ok(Objective {
                relevant: vec![st],
                score: Box::new(move |s| s.get(st)),
            })
        }
        ObjectiveDto::Weighted { weights } => {
            let mut ws: Vec<(Stat, f64)> = Vec::with_capacity(weights.len());
            for (k, v) in weights {
                ws.push((parse_stat(k)?, *v));
            }
            let relevant = ws.iter().map(|(s, _)| *s).collect();
            Ok(Objective {
                relevant,
                score: Box::new(move |s| ws.iter().map(|(st, w)| w * s.get(*st)).sum()),
            })
        }
        ObjectiveDto::EllenDamage { base_atk, skill_mv, enemy } => {
            let mut dag = Dag::new();
            let root = ellen_basic_hit(
                &mut dag,
                *base_atk,
                *skill_mv,
                Enemy { def: enemy.def, level_factor: enemy.level_factor, res_mult: enemy.res_mult },
            );
            Ok(Objective {
                relevant: vec![
                    Stat::AtkPct,
                    Stat::Atk,
                    Stat::IceDmg,
                    Stat::CritRate,
                    Stat::CritDmg,
                    Stat::PenRatio,
                    Stat::Pen,
                ],
                score: Box::new(move |s| dag.eval(root, s)),
            })
        }
    }
}

fn run(req: &str) -> Result<String, String> {
    let r: SolveRequest = serde_json::from_str(req).map_err(|e| e.to_string())?;
    let base = build_base(&r.base)?;
    let mut discs = Vec::with_capacity(r.discs.len());
    for d in &r.discs {
        discs.push(build_disc(d)?);
    }
    let objective = build_objective(&r.objective)?;
    let constraints: Vec<Constraint> = r
        .constraints
        .iter()
        .map(|c| Ok::<_, String>(Constraint { stat: parse_stat(&c.stat)?, min: c.min }))
        .collect::<Result<_, _>>()?;

    let mut bonuses = SetBonuses::new();
    for (k, sv) in &r.set_bonuses {
        let set: u16 = k.parse().map_err(|_| format!("bad set id: {k}"))?;
        bonuses.set_two_piece(set, parse_stat(&sv.stat)?, fp_from_f64(sv.value));
    }

    let builds = solve(&discs, &base, &objective, &constraints, &bonuses, r.top_n);
    let resp = SolveResponse {
        status: "ok",
        message: None,
        builds: builds
            .iter()
            .map(|b| BuildDto { disc_ids: b.disc_ids.clone(), score: b.score })
            .collect(),
        count: builds.len(),
    };
    serde_json::to_string(&resp).map_err(|e| e.to_string())
}

/// Parse a JSON `SolveRequest`, solve, and return a JSON `SolveResponse`.
/// Never panics on bad input — returns `{"status":"error","message":...}`.
pub fn solve_json(req: &str) -> String {
    match run(req) {
        Ok(json) => json,
        Err(message) => serde_json::to_string(&SolveResponse {
            status: "error",
            message: Some(message),
            builds: Vec::new(),
            count: 0,
        })
        .unwrap_or_else(|_| "{\"status\":\"error\"}".to_string()),
    }
}

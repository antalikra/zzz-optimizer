//! Phase-4: the JSON bridge parses a request, solves, and returns a JSON response.

use core_solver::solver::solve_json;

#[test]
fn weighted_request_returns_expected_build() {
    // 6 slots, one disc each: AtkPct 0.1 main + CritRate 0.02 sub.
    // base CR 0.05, CD 0.5. Expected weighted score:
    //   AtkPct 0.6*1000=600 ; CR (0.05+6*0.02=0.17)*2000=340 ; CD 0.5*1500=750 => 1690
    let req = r#"{
      "objective": { "kind": "weighted",
        "weights": { "CritRate": 2000, "CritDmg": 1500, "AtkPct": 1000, "Atk": 1, "IceDmg": 1000 } },
      "base": { "CritRate": 0.05, "CritDmg": 0.5 },
      "discs": [
        {"id":1,"set":0,"slot":1,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.1},{"stat":"CritRate","value":0.02}]},
        {"id":2,"set":0,"slot":2,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.1},{"stat":"CritRate","value":0.02}]},
        {"id":3,"set":0,"slot":3,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.1},{"stat":"CritRate","value":0.02}]},
        {"id":4,"set":0,"slot":4,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.1},{"stat":"CritRate","value":0.02}]},
        {"id":5,"set":0,"slot":5,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.1},{"stat":"CritRate","value":0.02}]},
        {"id":6,"set":0,"slot":6,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.1},{"stat":"CritRate","value":0.02}]}
      ],
      "constraints": [],
      "topN": 5
    }"#;

    let resp = solve_json(req);
    let v: serde_json::Value = serde_json::from_str(&resp).expect("response is JSON");
    assert_eq!(v["status"], "ok", "resp: {resp}");
    assert_eq!(v["count"], 1);
    let score = v["builds"][0]["score"].as_f64().unwrap();
    assert!((score - 1690.0).abs() < 1e-6, "score was {score}");
}

#[test]
fn malformed_request_returns_error_not_panic() {
    let v: serde_json::Value = serde_json::from_str(&solve_json("not json")).unwrap();
    assert_eq!(v["status"], "error");
    assert!(v["message"].is_string());
}

#[test]
fn unknown_stat_returns_error() {
    let req = r#"{"objective":{"kind":"maxStat","stat":"NotAStat"},"discs":[],"topN":1}"#;
    let v: serde_json::Value = serde_json::from_str(&solve_json(req)).unwrap();
    assert_eq!(v["status"], "error");
}

#[test]
fn ellen_damage_objective_works() {
    // camelCase fields (baseAtk/skillMv/levelFactor/resMult) must deserialize.
    let req = r#"{
      "objective": { "kind": "ellenDamage", "baseAtk": 2622, "skillMv": 1.5,
        "enemy": { "def": 600, "levelFactor": 800, "resMult": 1.0 } },
      "base": { "CritRate": 0.05, "CritDmg": 0.5 },
      "discs": [
        {"id":1,"set":0,"slot":1,"main":{"stat":"Atk","value":0},"subs":[{"stat":"IceDmg","value":0.05}]},
        {"id":2,"set":0,"slot":2,"main":{"stat":"Atk","value":0},"subs":[{"stat":"CritDmg","value":0.2}]},
        {"id":3,"set":0,"slot":3,"main":{"stat":"Atk","value":0},"subs":[]},
        {"id":4,"set":0,"slot":4,"main":{"stat":"CritRate","value":0.24},"subs":[]},
        {"id":5,"set":0,"slot":5,"main":{"stat":"IceDmg","value":0.30},"subs":[]},
        {"id":6,"set":0,"slot":6,"main":{"stat":"AtkPct","value":0.30},"subs":[]}
      ],
      "topN": 1
    }"#;
    let v: serde_json::Value = serde_json::from_str(&solve_json(req)).unwrap();
    assert_eq!(v["status"], "ok", "resp had error");
    let score = v["builds"][0]["score"].as_f64().unwrap();
    assert!(score > 0.0, "expected positive damage, got {score}");
}

#[test]
fn set_bonus_is_applied() {
    // 6 discs of set 0, each +0.05 AtkPct -> 0.30; set-0 2pc bonus +0.10 (count 6 >= 2) -> 0.40.
    let req = r#"{
      "objective": { "kind": "maxStat", "stat": "AtkPct" },
      "setBonuses": { "0": { "stat": "AtkPct", "value": 0.10 } },
      "discs": [
        {"id":1,"set":0,"slot":1,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.05}]},
        {"id":2,"set":0,"slot":2,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.05}]},
        {"id":3,"set":0,"slot":3,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.05}]},
        {"id":4,"set":0,"slot":4,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.05}]},
        {"id":5,"set":0,"slot":5,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.05}]},
        {"id":6,"set":0,"slot":6,"main":{"stat":"Atk","value":0},"subs":[{"stat":"AtkPct","value":0.05}]}
      ],
      "topN": 1
    }"#;
    let v: serde_json::Value = serde_json::from_str(&solve_json(req)).unwrap();
    assert_eq!(v["status"], "ok", "resp had error");
    let score = v["builds"][0]["score"].as_f64().unwrap();
    assert!((score - 0.40).abs() < 1e-6, "score was {score}");
}

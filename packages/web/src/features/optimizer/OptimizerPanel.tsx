import { useEffect, useMemo, useState } from "react";
import { useInventory } from "../../store/inventory";
import { useSolver } from "./useSolver";
import { SET_2PC, SETS, setIndex, toSolverValue, type Stat } from "../../domain/stats";
import { AGENTS, agentById } from "../../domain/agents";
import type { Disc } from "../../domain/inventory";
import type { DiscDto, ObjectiveDto, SolveRequest, SolveResponse } from "../../domain/solver";

type Kind = "damage" | "weighted" | "maxStat";
const WEIGHT_STATS: Stat[] = ["CritRate", "CritDmg", "AtkPct", "Atk", "IceDmg"];

function toDto(d: Disc): DiscDto {
  return {
    id: d.id,
    set: setIndex(d.set),
    slot: d.slot,
    main: { stat: d.mainStat, value: toSolverValue(d.mainStat, d.mainValue) },
    subs: d.subs.map((s) => ({ stat: s.stat, value: toSolverValue(s.stat, s.value) })),
  };
}

function buildSetBonuses(): Record<string, { stat: string; value: number }> {
  const out: Record<string, { stat: string; value: number }> = {};
  SETS.forEach((name, idx) => {
    const b = SET_2PC[name];
    if (b) out[String(idx)] = { stat: b.stat, value: toSolverValue(b.stat, b.value) };
  });
  return out;
}

export function OptimizerPanel() {
  const discs = useInventory((s) => s.discs);
  const { solve } = useSolver();

  const [agentId, setAgentId] = useState("ellen");
  const agent = agentById(agentId);
  const canDamage = !!agent.damageFormula;

  const [kind, setKind] = useState<Kind>("damage");
  const [maxStat, setMaxStat] = useState<Stat>("CritDmg");
  const [weights, setWeights] = useState<Record<string, number>>({
    CritRate: 2, CritDmg: 1, AtkPct: 1, Atk: 0.001, IceDmg: 1,
  });
  const [wEngineAtk, setWEngineAtk] = useState(684);
  const [skillMv, setSkillMv] = useState(1.5);
  const [enemyDef, setEnemyDef] = useState(600);
  const [resMult, setResMult] = useState(1.0);

  const [topN, setTopN] = useState(5);
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState<SolveResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!canDamage && kind === "damage") setKind("weighted");
  }, [canDamage, kind]);

  const byId = useMemo(() => new Map(discs.map((d) => [d.id, d])), [discs]);
  const ready = [1, 2, 3, 4, 5, 6].every((s) => new Set(discs.map((d) => d.slot)).has(s));

  function buildObjective(): ObjectiveDto {
    if (kind === "damage" && agent.damageFormula === "ellen") {
      return {
        kind: "ellenDamage",
        baseAtk: agent.baseAtk + wEngineAtk,
        skillMv,
        enemy: { def: enemyDef, levelFactor: 800, resMult },
      };
    }
    if (kind === "maxStat") return { kind: "maxStat", stat: maxStat };
    return { kind: "weighted", weights };
  }

  async function run() {
    setRunning(true);
    setErr(null);
    setResp(null);
    const req: SolveRequest = {
      objective: buildObjective(),
      base: { CritRate: agent.baseCritRate / 100, CritDmg: agent.baseCritDmg / 100 },
      discs: discs.map(toDto),
      constraints: [],
      setBonuses: buildSetBonuses(),
      topN,
    };
    try {
      setResp(await solve(req));
    } catch (e) {
      setErr(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card">
      <h3 className="card__title">Optimize</h3>

      <div className="row">
        <label className="field">
          <span className="field__label">Agent</span>
          <select className="select w-md" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Objective</span>
          <select className="select w-md" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            {canDamage && <option value="damage">damage</option>}
            <option value="weighted">weighted</option>
            <option value="maxStat">maxStat</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">Top N</span>
          <input className="input w-xs" type="number" min={1} max={50} value={topN}
            onChange={(e) => setTopN(Number(e.target.value))} />
        </label>
      </div>

      {kind === "damage" && (
        <div className="row" style={{ marginTop: 14 }}>
          <label className="field">
            <span className="field__label">W-Engine ATK</span>
            <input className="input w-sm" type="number" value={wEngineAtk}
              onChange={(e) => setWEngineAtk(Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="field__label">Skill MV</span>
            <input className="input w-xs" type="number" step="0.1" value={skillMv}
              onChange={(e) => setSkillMv(Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="field__label">Enemy DEF</span>
            <input className="input w-sm" type="number" value={enemyDef}
              onChange={(e) => setEnemyDef(Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="field__label">RES mult</span>
            <input className="input w-xs" type="number" step="0.05" value={resMult}
              onChange={(e) => setResMult(Number(e.target.value))} />
          </label>
        </div>
      )}

      {kind === "maxStat" && (
        <div className="row" style={{ marginTop: 14 }}>
          <label className="field">
            <span className="field__label">Stat</span>
            <select className="select w-md" value={maxStat} onChange={(e) => setMaxStat(e.target.value as Stat)}>
              {WEIGHT_STATS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      )}

      {kind === "weighted" && (
        <div className="row" style={{ marginTop: 14 }}>
          {WEIGHT_STATS.map((s) => (
            <label className="field" key={s}>
              <span className="field__label">{s}</span>
              <input className="input w-xs" type="number" step="0.1" value={weights[s] ?? 0}
                onChange={(e) => setWeights((w) => ({ ...w, [s]: Number(e.target.value) }))} />
            </label>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 20, alignItems: "center" }}>
        <button className="btn btn--primary" onClick={run} disabled={running || !ready}>
          {running ? "Running…" : "Optimize"}
        </button>
        {!ready && <span className="error-text">Need ≥1 disc in every slot 1–6.</span>}
      </div>

      {err && <p className="error-text" style={{ marginTop: 12 }}>Error: {err}</p>}

      {resp?.status === "ok" && (
        <div className="tbl-wrap" style={{ marginTop: 18 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th className="tbl__num">Score</th>
                <th>Discs (slot : set)</th>
              </tr>
            </thead>
            <tbody>
              {resp.builds.map((b, i) => (
                <tr key={i}>
                  <td><span className="badge badge--accent">{i + 1}</span></td>
                  <td className="tbl__num">{b.score.toFixed(2)}</td>
                  <td className="muted">
                    {b.discIds
                      .map((id) => {
                        const d = byId.get(id);
                        return d ? `${d.slot}:${d.set}` : String(id);
                      })
                      .join("  ·  ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {resp?.status === "error" && <p className="error-text" style={{ marginTop: 12 }}>Solver error: {resp.message}</p>}
    </div>
  );
}

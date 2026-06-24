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
  // Damage-objective inputs
  const [wEngineAtk, setWEngineAtk] = useState(684);
  const [skillMv, setSkillMv] = useState(1.5);
  const [enemyDef, setEnemyDef] = useState(600);
  const [resMult, setResMult] = useState(1.0);

  const [topN, setTopN] = useState(5);
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState<SolveResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Fall back off "damage" if the chosen agent has no damage formula.
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
    <section>
      <h3>Optimize</h3>

      <div className="row">
        <label>Agent{" "}
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label>Objective{" "}
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            {canDamage && <option value="damage">damage</option>}
            <option value="weighted">weighted</option>
            <option value="maxStat">maxStat</option>
          </select>
        </label>
        <label>Top N{" "}
          <input type="number" min={1} max={50} value={topN}
            onChange={(e) => setTopN(Number(e.target.value))} style={{ width: 56 }} />
        </label>
      </div>

      {kind === "damage" && (
        <div className="row" style={{ marginTop: 8 }}>
          <label>W-Engine ATK{" "}
            <input type="number" value={wEngineAtk}
              onChange={(e) => setWEngineAtk(Number(e.target.value))} style={{ width: 80 }} />
          </label>
          <label>Skill MV{" "}
            <input type="number" step="0.1" value={skillMv}
              onChange={(e) => setSkillMv(Number(e.target.value))} style={{ width: 64 }} />
          </label>
          <label>Enemy DEF{" "}
            <input type="number" value={enemyDef}
              onChange={(e) => setEnemyDef(Number(e.target.value))} style={{ width: 72 }} />
          </label>
          <label>RES mult{" "}
            <input type="number" step="0.05" value={resMult}
              onChange={(e) => setResMult(Number(e.target.value))} style={{ width: 64 }} />
          </label>
        </div>
      )}

      {kind === "maxStat" && (
        <div className="row" style={{ marginTop: 8 }}>
          <label>Stat{" "}
            <select value={maxStat} onChange={(e) => setMaxStat(e.target.value as Stat)}>
              {WEIGHT_STATS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      )}

      {kind === "weighted" && (
        <div className="row" style={{ marginTop: 8 }}>
          {WEIGHT_STATS.map((s) => (
            <label key={s}>{s}{" "}
              <input type="number" step="0.1" value={weights[s] ?? 0}
                onChange={(e) => setWeights((w) => ({ ...w, [s]: Number(e.target.value) }))}
                style={{ width: 64 }} />
            </label>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={run} disabled={running || !ready}>{running ? "Running…" : "Optimize"}</button>
        {!ready && <span style={{ marginLeft: 8, color: "#a00" }}>Need ≥1 disc in every slot 1–6.</span>}
      </div>

      {err && <p style={{ color: "#a00" }}>Error: {err}</p>}

      {resp?.status === "ok" && (
        <table style={{ marginTop: 12 }}>
          <thead><tr><th>#</th><th>Score</th><th>Discs (slot:set)</th></tr></thead>
          <tbody>
            {resp.builds.map((b, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{b.score.toFixed(2)}</td>
                <td>
                  {b.discIds
                    .map((id) => {
                      const d = byId.get(id);
                      return d ? `${d.slot}:${d.set}` : String(id);
                    })
                    .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {resp?.status === "error" && <p style={{ color: "#a00" }}>Solver error: {resp.message}</p>}
    </section>
  );
}

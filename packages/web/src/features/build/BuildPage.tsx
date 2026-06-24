import { useEffect, useMemo, useState } from "react";
import { useTeam, DEFAULT_AGENT_LEVEL } from "../../store/team";
import { useInventory } from "../../store/inventory";
import { useSolver } from "../optimizer/useSolver";
import { agentById, effectiveBaseAtk, scaleByLevel } from "../../domain/agents";
import { buildSetBonuses, discToDto, slotsCovered } from "../../domain/solverRequest";
import { generateTestDiscs } from "../../domain/testdata";
import { setIcon } from "../../domain/sets";
import { computeBuildStats, type BuildStats } from "./computeBuild";
import { AgentAvatar } from "./AgentAvatar";
import { TeamBar } from "./TeamBar";
import type { Disc } from "../../domain/inventory";
import type { SolveRequest } from "../../domain/solver";

const WENGINE_ATK = 684;
const ENEMY_DEF = 600;
const RES_MULT = 1.0;

interface Result {
  damage: number;
  dps: number;
  stats: BuildStats;
  discs: Disc[];
}

const pct = (f: number) => `${(f * 100).toFixed(1)}%`;
const fmt = (n: number) => n.toLocaleString("en-US");

export function BuildPage() {
  const slots = useTeam((s) => s.slots);
  const active = useTeam((s) => s.active);
  const levels = useTeam((s) => s.levels);
  const setLevel = useTeam((s) => s.setLevel);
  const discs = useInventory((s) => s.discs);
  const addMany = useInventory((s) => s.addMany);
  const { solve } = useSolver();

  const activeId = slots[active];
  const agent = activeId ? agentById(activeId) : null;
  const level = activeId ? levels[activeId] ?? DEFAULT_AGENT_LEVEL : DEFAULT_AGENT_LEVEL;

  const [rotationId, setRotationId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setRotationId(agent?.rotations[0]?.id ?? "");
    setResult(null);
    setErr(null);
  }, [activeId, agent]);

  const byId = useMemo(() => new Map(discs.map((d) => [d.id, d])), [discs]);
  const ready = slotsCovered(discs);
  const rotation = agent?.rotations.find((r) => r.id === rotationId) ?? agent?.rotations[0];

  function bumpLevel(delta: number) {
    if (!agent) return;
    setLevel(agent.id, Math.max(1, Math.min(60, level + delta)));
  }

  async function optimize() {
    if (!agent?.damageFormula || !rotation) return;
    setRunning(true);
    setErr(null);
    setResult(null);
    const req: SolveRequest = {
      objective: {
        kind: "ellenDamage",
        baseAtk: effectiveBaseAtk(agent, level) + WENGINE_ATK,
        skillMv: rotation.totalMv,
        enemy: { def: ENEMY_DEF, levelFactor: 800, resMult: RES_MULT },
      },
      base: { CritRate: agent.baseCritRate / 100, CritDmg: agent.baseCritDmg / 100 },
      discs: discs.map(discToDto),
      constraints: [],
      setBonuses: buildSetBonuses(),
      topN: 1,
    };
    try {
      const resp = await solve(req);
      if (resp.status === "ok" && resp.builds[0]) {
        const best = resp.builds[0];
        const bDiscs = best.discIds.map((id) => byId.get(id)).filter((x): x is Disc => Boolean(x));
        setResult({
          damage: best.score,
          dps: best.score / rotation.durationSec,
          stats: computeBuildStats(agent.id, level, WENGINE_ATK, bDiscs),
          discs: bDiscs,
        });
      } else {
        setErr(resp.message ?? "no build found");
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h3 className="card__title">Team</h3>
        <TeamBar />
      </div>

      {!agent && <p className="empty">Pick an agent above to build.</p>}

      {agent && (
        <div className="card">
          {/* Header */}
          <div className="agent-head">
            <span className="agent-head__ring" style={{ borderColor: agent.accent }}>
              <AgentAvatar agent={agent} size={72} />
            </span>
            <div style={{ flex: 1 }}>
              <h2 className="agent-head__name">{agent.name}</h2>
              <div className="agent-head__meta">
                <span style={{ color: agent.accent, fontWeight: 600 }}>{agent.element}</span>
                {" · "}
                <span className="badge">{agent.role}</span>
              </div>
              <div className="level-ctl">
                <button className="btn btn--icon btn--ghost" onClick={() => bumpLevel(-1)}>−</button>
                <span className="level-ctl__val">Lv {level}</span>
                <button className="btn btn--icon btn--ghost" onClick={() => bumpLevel(1)}>+</button>
              </div>
            </div>
          </div>

          {/* Base stats — read-only, derived from level */}
          <h4 className="section-h">Base stats <span className="muted">(from level, not editable)</span></h4>
          <div className="stat-grid">
            <StatCell k="HP" v={fmt(scaleByLevel(agent.baseHp, level))} />
            <StatCell k="ATK" v={fmt(scaleByLevel(agent.baseAtk, level))} />
            <StatCell k="DEF" v={fmt(scaleByLevel(agent.baseDef, level))} />
            <StatCell k="CRIT Rate" v={`${agent.baseCritRate}%`} />
            <StatCell k="CRIT DMG" v={`${agent.baseCritDmg}%`} />
            <StatCell k="Impact" v={fmt(agent.impact)} />
            <StatCell k="Anomaly Mastery" v={fmt(agent.anomalyMastery)} />
            <StatCell k="Anomaly Proficiency" v={fmt(agent.anomalyProficiency)} />
          </div>

          {/* Damage optimization (Attack core only) */}
          {!agent.damageFormula ? (
            <p className="muted" style={{ marginTop: 20 }}>
              {agent.role} agent — supports aren't build-optimized yet. Only the team's Attack core gets
              its discs optimized; passive-condition toggles for this role are coming.
            </p>
          ) : (
            <>
              <h4 className="section-h" style={{ marginTop: 22 }}>Optimize discs for damage</h4>
              <div className="row" style={{ alignItems: "flex-end" }}>
                <label className="field">
                  <span className="field__label">Rotation</span>
                  <select className="select w-md" value={rotationId} onChange={(e) => setRotationId(e.target.value)}>
                    {agent.rotations.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} · {r.durationSec}s</option>
                    ))}
                  </select>
                </label>
                {ready ? (
                  <button className="btn btn--primary" onClick={optimize} disabled={running}>
                    {running ? "Optimizing…" : "Optimize discs"}
                  </button>
                ) : (
                  <button className="btn btn--outline" onClick={() => addMany(generateTestDiscs(3))}>
                    Generate test discs first
                  </button>
                )}
              </div>
              {!ready && <p className="muted" style={{ marginTop: 8 }}>Inventory needs ≥1 disc in every slot 1–6.</p>}

              {err && <p className="error-text" style={{ marginTop: 12 }}>Error: {err}</p>}

              {result && (
                <div style={{ marginTop: 22 }}>
                  <div className="dps">
                    <span className="dps__val">{fmt(Math.round(result.dps))}</span>
                    <span className="dps__unit">DPS · {fmt(Math.round(result.damage))} per rotation</span>
                  </div>

                  <h4 className="section-h" style={{ marginTop: 18 }}>Final stats (with optimized discs)</h4>
                  <div className="stat-grid">
                    <StatCell k="ATK" v={fmt(Math.round(result.stats.atk))} hot />
                    <StatCell k="CRIT Rate" v={pct(result.stats.critRate)} hot />
                    <StatCell k="CRIT DMG" v={pct(result.stats.critDmg)} hot />
                    <StatCell k="ATK%" v={pct(result.stats.atkPct)} />
                    <StatCell k="Ice DMG" v={pct(result.stats.iceDmg)} />
                    <StatCell k="PEN" v={fmt(Math.round(result.stats.pen))} />
                  </div>

                  <h4 className="section-h" style={{ marginTop: 18 }}>Best discs</h4>
                  <div className="disc-row">
                    {result.discs.map((d) => {
                      const ic = setIcon(d.set);
                      return (
                        <div className="disc-tile" key={d.id}>
                          <div className="disc-tile__slot">Slot {d.slot}</div>
                          <div className="disc-tile__main">{d.mainStat} {d.mainValue}</div>
                          <div className="disc-tile__set">
                            {ic && <img src={ic} alt="" />}
                            {d.set}
                          </div>
                          <div className="disc-tile__subs">
                            {d.subs.map((s) => `${s.stat} ${s.value}`).join("\n") || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div className="stat-cell">
      <span className="stat-cell__k">{k}</span>
      <span className="stat-cell__v" style={hot ? { color: "var(--accent)" } : undefined}>{v}</span>
    </div>
  );
}

import { useRef, useState, type ChangeEvent } from "react";
import { useInventory } from "../../store/inventory";
import { exportInventory, parseImport } from "../../services/serialize";
import { AGENTS } from "../../domain/agents";
import { DISC_SETS } from "../../domain/sets";
import { WENGINES, rarityLabel } from "../../domain/wengines";
import { AgentAvatar } from "../build/AgentAvatar";

type Section = "agents" | "wengines" | "sets";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "agents", label: `Agents · ${AGENTS.length}` },
  { id: "wengines", label: `W-Engines · ${WENGINES.length}` },
  { id: "sets", label: `Disc Sets · ${DISC_SETS.length}` },
];

function Icon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="cat-item__ph" />;
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}

export function DatabasePanel() {
  const discs = useInventory((s) => s.discs);
  const replaceAll = useInventory((s) => s.replaceAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<Section>("agents");
  const [msg, setMsg] = useState<string | null>(null);

  function download() {
    const blob = new Blob([exportInventory(discs)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zzz-inventory.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      replaceAll(imported);
      setMsg(`Imported ${imported.length} discs.`);
    } catch (err) {
      setMsg(`Import failed: ${String(err)}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h3 className="card__title">Database</h3>
        <div className="tabs-pill" style={{ marginBottom: 18 }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`tab-pill ${section === s.id ? "is-active" : ""}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === "agents" && (
          <div className="cat-grid">
            {AGENTS.map((a) => (
              <div className="cat-item" key={a.id}>
                <AgentAvatar agent={a} size={52} />
                <div className="cat-item__name">{a.name}</div>
                <div className="cat-item__sub" style={{ color: a.accent }}>{a.element} · {a.role}</div>
              </div>
            ))}
          </div>
        )}

        {section === "wengines" && (
          <div className="cat-grid">
            {WENGINES.map((w) => (
              <div className="cat-item" key={w.id}>
                <Icon src={w.icon} alt={w.id} />
                <div className="cat-item__name">{rarityLabel(w.rarity)} · {w.role}</div>
                <div className="cat-item__sub">ATK {w.baseAtk}</div>
              </div>
            ))}
          </div>
        )}

        {section === "sets" && (
          <div className="cat-grid">
            {DISC_SETS.map((s) => (
              <div className="cat-item" key={s.id}>
                <Icon src={s.icon} alt={s.name} />
                <div className="cat-item__name">{s.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card__title">Backup</h3>
        <div className="row">
          <button className="btn btn--outline" onClick={download} disabled={discs.length === 0}>
            Export inventory · {discs.length}
          </button>
          <button className="btn btn--outline" onClick={() => fileRef.current?.click()}>Import…</button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onFile} style={{ display: "none" }} />
        </div>
        {msg && <p className="muted" style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </div>
  );
}

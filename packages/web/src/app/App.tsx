import { useEffect, useRef, useState } from "react";
import { createLogger } from "../lib/logger";
import type { SolveRequest, SolveResponse, DiscDto } from "../domain/solver";
import type { WorkerResponse } from "../workers/solver.worker";

const log = createLogger("app");

/** A small deterministic sample inventory: 6 slots, 2 discs each (64 builds). */
function sampleRequest(): SolveRequest {
  const subStats = ["CritRate", "CritDmg", "AtkPct", "Atk", "IceDmg"];
  const slotMain = ["Hp", "Atk", "Def"]; // slots 1-3 fixed flat mains
  const discs: DiscDto[] = [];
  let id = 1;
  for (let slot = 1; slot <= 6; slot++) {
    for (let k = 0; k < 2; k++) {
      discs.push({
        id: id++,
        set: 0,
        slot,
        main:
          slot <= 3
            ? { stat: slotMain[slot - 1], value: 0 }
            : { stat: "AtkPct", value: 0.3 },
        subs: [
          { stat: subStats[(slot + k) % subStats.length], value: 0.03 * (k + 1) },
          { stat: "CritRate", value: 0.024 },
        ],
      });
    }
  }
  return {
    objective: {
      kind: "weighted",
      weights: { CritRate: 2000, CritDmg: 1500, AtkPct: 1000, Atk: 1, IceDmg: 1000 },
    },
    base: { CritRate: 0.05, CritDmg: 0.5 },
    discs,
    constraints: [],
    topN: 5,
  };
}

function makeWorker(): Worker {
  return new Worker(new URL("../workers/solver.worker.ts", import.meta.url), { type: "module" });
}

export function App() {
  const [handshake, setHandshake] = useState("connecting…");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const startRef = useRef(0);

  function attach(worker: Worker) {
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      log.info("worker message", msg);
      if (msg.kind === "greet") {
        setHandshake(msg.result);
      } else if (msg.kind === "solve") {
        setElapsedMs(performance.now() - startRef.current);
        setRunning(false);
        setResult(JSON.parse(msg.result) as SolveResponse);
      } else if (msg.kind === "error") {
        setRunning(false);
        setResult({ status: "error", message: msg.error, builds: [], count: 0 });
      }
    };
  }

  useEffect(() => {
    const worker = makeWorker();
    workerRef.current = worker;
    attach(worker);
    worker.postMessage({ kind: "greet" });
    return () => worker.terminate();
  }, []);

  function run() {
    if (!workerRef.current) return;
    setRunning(true);
    setResult(null);
    setElapsedMs(null);
    startRef.current = performance.now();
    workerRef.current.postMessage({ kind: "solve", requestJson: JSON.stringify(sampleRequest()) });
  }

  function cancel() {
    // The solver is a single WASM call, so cancel = terminate + recreate the worker.
    // Incremental progress/yielding is a later refinement.
    workerRef.current?.terminate();
    const worker = makeWorker();
    workerRef.current = worker;
    attach(worker);
    setRunning(false);
    log.warn("solve cancelled (worker terminated)");
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 640 }}>
      <h1>ZZZ Optimizer</h1>
      <p>
        Solver handshake: <code>{handshake}</code>
      </p>

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <button onClick={run} disabled={running}>
          Run sample optimize
        </button>
        <button onClick={cancel} disabled={!running}>
          Cancel
        </button>
      </div>

      {running && <p>Running…</p>}

      {result && (
        <section>
          <p>
            status: <b>{result.status}</b>
            {result.message ? ` — ${result.message}` : ""}
            {elapsedMs != null ? ` · ${elapsedMs.toFixed(1)} ms` : ""}
          </p>
          {result.status === "ok" && (
            <ol>
              {result.builds.map((b, i) => (
                <li key={i}>
                  score {b.score.toFixed(2)} — discs [{b.discIds.join(", ")}]
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </main>
  );
}

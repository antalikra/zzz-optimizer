import { useCallback, useEffect, useRef } from "react";
import type { SolveRequest, SolveResponse } from "../../domain/solver";

function makeWorker(): Worker {
  return new Worker(new URL("../../workers/solver.worker.ts", import.meta.url), { type: "module" });
}

/** Owns a Web Worker running the WASM solver; `solve` resolves a SolveResponse. */
export function useSolver() {
  const ref = useRef<Worker | null>(null);

  useEffect(() => {
    const w = makeWorker();
    ref.current = w;
    return () => w.terminate();
  }, []);

  const solve = useCallback(
    (req: SolveRequest) =>
      new Promise<SolveResponse>((resolve, reject) => {
        const w = ref.current;
        if (!w) {
          reject(new Error("worker not ready"));
          return;
        }
        w.onmessage = (e: MessageEvent) => {
          const m = e.data;
          if (m.kind === "solve") resolve(JSON.parse(m.result) as SolveResponse);
          else if (m.kind === "error") reject(new Error(m.error));
        };
        w.postMessage({ kind: "solve", requestJson: JSON.stringify(req) });
      }),
    [],
  );

  return { solve };
}

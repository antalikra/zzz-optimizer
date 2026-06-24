// Web Worker: runs the solver off the UI thread so a long solve never freezes
// the interface. See docs/FRONTEND.md.
import { loadSolver, type SolverApi } from "../services/wasm-bridge";

let api: Promise<SolverApi> | null = null;
function solver(): Promise<SolverApi> {
  if (!api) api = loadSolver();
  return api;
}

export type WorkerRequest =
  | { kind: "greet" }
  | { kind: "solve"; requestJson: string };

export type WorkerResponse =
  | { kind: "greet"; result: string }
  | { kind: "solve"; result: string }
  | { kind: "error"; error: string };

function post(msg: WorkerResponse): void {
  (self as unknown as Worker).postMessage(msg);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>): Promise<void> => {
  try {
    const s = await solver();
    if (e.data.kind === "greet") {
      post({ kind: "greet", result: s.greet() });
    } else {
      post({ kind: "solve", result: s.solve(e.data.requestJson) });
    }
  } catch (err) {
    post({ kind: "error", error: String(err) });
  }
};

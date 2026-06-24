import { useEffect, useState } from "react";
import { createLogger } from "../lib/logger";
import type { WorkerResponse } from "../workers/solver.worker";

const log = createLogger("app");

export function App() {
  const [status, setStatus] = useState("connecting to solver…");

  useEffect(() => {
    const worker = new Worker(new URL("../workers/solver.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      log.info("worker message", e.data);
      if (e.data.kind === "greet") setStatus(e.data.result);
      if (e.data.kind === "error") setStatus(`error: ${e.data.error}`);
    };
    worker.postMessage({ kind: "greet" });
    return () => worker.terminate();
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>ZZZ Optimizer</h1>
      <p>Phase 0 scaffold — solver handshake:</p>
      <pre>{status}</pre>
    </main>
  );
}

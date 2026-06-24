// Lightweight namespaced logger with an in-memory ring buffer.
// See docs/FRONTEND.md "Logging". Do NOT call this inside tight loops.

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: number;
  level: LogLevel;
  ns: string;
  msg: string;
  data?: unknown;
}

const RING_CAPACITY = 500;
const ring: LogEntry[] = [];

function push(entry: LogEntry): void {
  ring.push(entry);
  if (ring.length > RING_CAPACITY) ring.shift();
}

const order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
let minLevel: LogLevel = "debug";

export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

export function createLogger(ns: string) {
  const log = (level: LogLevel, msg: string, data?: unknown): void => {
    if (order[level] < order[minLevel]) return;
    push({ ts: Date.now(), level, ns, msg, data });
    const sink = level === "debug" ? console.log : console[level];
    sink(`[${ns}] ${msg}`, data ?? "");
  };
  return {
    debug: (m: string, d?: unknown) => log("debug", m, d),
    info: (m: string, d?: unknown) => log("info", m, d),
    warn: (m: string, d?: unknown) => log("warn", m, d),
    error: (m: string, d?: unknown) => log("error", m, d),
  };
}

/** Export the ring buffer as JSON for a reproducible bug report. */
export function exportLogs(): string {
  return JSON.stringify(ring, null, 2);
}

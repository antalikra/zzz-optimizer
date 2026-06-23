# ZZZ Optimizer

A build optimizer for **Zenless Zone Zero**. Find the mathematically optimal set of Drive Discs
for any agent — fast and exact.

> 🚧 Work in progress — early development.

## What it does

- Pick the best Drive Discs from your inventory for a chosen agent and objective
  (maximize damage, maximize a stat, or a weighted target).
- Respect set bonuses (4+2 / 2+2+2) and stat constraints
  (e.g. minimum Energy Regen, crit targets, anomaly thresholds).
- Return the top-N builds with a full stat and damage breakdown.

## Tech stack

- **Frontend:** React + TypeScript
- **Solver core:** Rust compiled to WebAssembly, running in a Web Worker
- **Storage:** local (IndexedDB) — fully client-side, no account, no server
- **Desktop build (planned):** Tauri

## How the optimizer works (high level)

The solver treats the 6 disc slots as a constrained search and uses
**branch-and-bound with dominance pruning** to find the provable optimum without brute-forcing the
full combination space — keeping it fast even on large inventories.

## Status / Roadmap

- [ ] Project scaffold (monorepo: pnpm + cargo workspace)
- [ ] Game-data schema + first agent
- [ ] Damage formula engine
- [ ] Branch-and-bound solver
- [ ] WASM bridge + Web Worker
- [ ] Inventory UI + optimizer results
- [ ] Import / export (GOOD-style)
- [ ] OCR screenshot scanner
- [ ] Desktop build (Tauri)

## License

TBD

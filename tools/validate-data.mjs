// Validates each game-data file against its JSON schema (the "validate on load"
// pipeline from docs/DATA-MODEL.md). Run via `pnpm validate:data`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv from "ajv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "packages/game-data/data/v0");
const schemaDir = join(root, "packages/game-data/schema");

const pairs = [
  ["agents.json", "agents.schema.json"],
  ["w-engines.json", "w-engines.schema.json"],
  ["disc-sets.json", "disc-sets.schema.json"],
  ["stat-tables.json", "stat-tables.schema.json"],
];

const ajv = new Ajv({ allErrors: true });
let ok = true;

for (const [dataFile, schemaFile] of pairs) {
  const schema = JSON.parse(readFileSync(join(schemaDir, schemaFile), "utf8"));
  const data = JSON.parse(readFileSync(join(dataDir, dataFile), "utf8"));
  const validate = ajv.compile(schema);
  if (validate(data)) {
    console.log(`✓ ${dataFile}`);
  } else {
    ok = false;
    console.error(`✗ ${dataFile}`);
    for (const e of validate.errors ?? []) {
      console.error(`   ${e.instancePath || "(root)"} ${e.message}`);
    }
  }
}

process.exit(ok ? 0 : 1);

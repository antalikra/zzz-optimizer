// Persistent inventory storage in IndexedDB (via idb-keyval). On disk in the
// browser profile, survives reload/restart. See docs/DATA-MODEL.md "Durability".
// Stored as a versioned envelope so the format can evolve with migrations.
import { get, set } from "idb-keyval";
import type { Disc } from "../domain/inventory";

const KEY = "zzz-inventory";
const STORAGE_VERSION = 1;

interface StoredData {
  version: number;
  discs: Disc[];
}

export async function loadInventory(): Promise<Disc[]> {
  const raw = await get<unknown>(KEY);
  if (!raw) return [];
  // Legacy v0: a bare array. Migrated to the envelope on the next save.
  if (Array.isArray(raw)) return raw as Disc[];
  const data = raw as Partial<StoredData>;
  // Future migrations switch on data.version here.
  return Array.isArray(data.discs) ? data.discs : [];
}

export async function saveInventory(discs: Disc[]): Promise<void> {
  const data: StoredData = { version: STORAGE_VERSION, discs };
  await set(KEY, data);
}

/** Ask the browser to keep our storage (avoid eviction under pressure). */
export async function requestPersist(): Promise<boolean> {
  if (navigator.storage?.persist) return navigator.storage.persist();
  return false;
}

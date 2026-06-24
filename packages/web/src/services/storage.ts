// Persistent inventory storage in IndexedDB (via idb-keyval). On disk in the
// browser profile, survives reload/restart. See docs/DATA-MODEL.md "Durability".
import { get, set } from "idb-keyval";
import type { Disc } from "../domain/inventory";

const KEY = "zzz-inventory";

export async function loadInventory(): Promise<Disc[]> {
  return (await get<Disc[]>(KEY)) ?? [];
}

export async function saveInventory(discs: Disc[]): Promise<void> {
  await set(KEY, discs);
}

/** Ask the browser to keep our storage (avoid eviction under pressure). */
export async function requestPersist(): Promise<boolean> {
  if (navigator.storage?.persist) return navigator.storage.persist();
  return false;
}

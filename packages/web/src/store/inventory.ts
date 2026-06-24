import { create } from "zustand";
import type { Disc, NewDisc } from "../domain/inventory";
import { loadInventory, saveInventory } from "../services/storage";

interface InventoryState {
  discs: Disc[];
  nextId: number;
  hydrate: () => Promise<void>;
  add: (d: NewDisc) => void;
  addMany: (ds: NewDisc[]) => void;
  remove: (id: number) => void;
  clear: () => void;
  replaceAll: (discs: Disc[]) => void;
}

export const useInventory = create<InventoryState>((set, get) => {
  const persist = () => void saveInventory(get().discs);
  return {
    discs: [],
    nextId: 1,
    hydrate: async () => {
      const discs = await loadInventory();
      const nextId = discs.reduce((m, d) => Math.max(m, d.id), 0) + 1;
      set({ discs, nextId });
    },
    add: (d) => {
      const id = get().nextId;
      set((s) => ({ discs: [...s.discs, { ...d, id }], nextId: s.nextId + 1 }));
      persist();
    },
    addMany: (ds) => {
      set((s) => {
        let id = s.nextId;
        const added = ds.map((d) => ({ ...d, id: id++ }));
        return { discs: [...s.discs, ...added], nextId: id };
      });
      persist();
    },
    remove: (id) => {
      set((s) => ({ discs: s.discs.filter((x) => x.id !== id) }));
      persist();
    },
    clear: () => {
      set({ discs: [] });
      persist();
    },
    replaceAll: (discs) => {
      const nextId = discs.reduce((m, d) => Math.max(m, d.id), 0) + 1;
      set({ discs, nextId });
      persist();
    },
  };
});

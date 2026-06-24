import { create } from "zustand";

interface TeamState {
  slots: (string | null)[]; // 3 agent ids (or null = empty)
  active: number; // index of the slot being edited
  setSlot: (i: number, agentId: string | null) => void;
  setActive: (i: number) => void;
}

export const useTeam = create<TeamState>((set) => ({
  slots: [null, null, null],
  active: 0,
  setSlot: (i, agentId) =>
    set((s) => {
      const slots = [...s.slots];
      slots[i] = agentId;
      return { slots, active: i };
    }),
  setActive: (i) => set({ active: i }),
}));

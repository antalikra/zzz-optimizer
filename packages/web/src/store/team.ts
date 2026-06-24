import { create } from "zustand";

const DEFAULT_LEVEL = 60;

interface TeamState {
  slots: (string | null)[]; // 3 agent ids (or null = empty)
  active: number; // index of the slot being edited
  levels: Record<string, number>; // agentId -> level
  setSlot: (i: number, agentId: string | null) => void;
  setActive: (i: number) => void;
  setLevel: (agentId: string, level: number) => void;
}

export const useTeam = create<TeamState>((set) => ({
  slots: [null, null, null],
  active: 0,
  levels: {},
  setSlot: (i, agentId) =>
    set((s) => {
      const slots = [...s.slots];
      slots[i] = agentId;
      return { slots, active: i };
    }),
  setActive: (i) => set({ active: i }),
  setLevel: (agentId, level) =>
    set((s) => ({ levels: { ...s.levels, [agentId]: level } })),
}));

export const DEFAULT_AGENT_LEVEL = DEFAULT_LEVEL;

import { useState } from "react";
import { AGENTS, agentById } from "../../domain/agents";
import { useTeam } from "../../store/team";
import { AgentAvatar } from "./AgentAvatar";

export function TeamBar() {
  const slots = useTeam((s) => s.slots);
  const active = useTeam((s) => s.active);
  const setSlot = useTeam((s) => s.setSlot);
  const setActive = useTeam((s) => s.setActive);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="team">
      {slots.map((id, i) => {
        const agent = id ? agentById(id) : null;
        return (
          <div key={i} style={{ position: "relative" }}>
            <button
              className={`agent-slot ${active === i && agent ? "is-active" : ""}`}
              onClick={() => {
                if (agent) setActive(i);
                setOpen(open === i ? null : i);
              }}
            >
              {agent ? (
                <>
                  <AgentAvatar agent={agent} size={56} />
                  <span className="agent-slot__name">{agent.name}</span>
                </>
              ) : (
                <span className="agent-slot__plus">+</span>
              )}
            </button>

            {open === i && (
              <div className="picker" onMouseLeave={() => setOpen(null)}>
                {AGENTS.map((a) => (
                  <button
                    key={a.id}
                    className="picker__item"
                    onClick={() => {
                      setSlot(i, a.id);
                      setOpen(null);
                    }}
                  >
                    <AgentAvatar agent={a} size={28} />
                    {a.name}
                  </button>
                ))}
                {agent && (
                  <button
                    className="picker__item picker__clear"
                    onClick={() => {
                      setSlot(i, null);
                      setOpen(null);
                    }}
                  >
                    Clear slot
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

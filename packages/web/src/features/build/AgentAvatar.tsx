import { useState } from "react";
import { ELEMENT_COLOR, type Agent } from "../../domain/agents";

/**
 * Agent avatar. Tries a local image at `/agents/{id}.webp`; on miss (no file
 * yet) falls back to an element-colored initial tile. Real images can be dropped
 * into `public/agents/` later with no code change.
 */
export function AgentAvatar({ agent, size = 64 }: { agent: Agent; size?: number }) {
  const [failed, setFailed] = useState(false);
  const color = ELEMENT_COLOR[agent.element] ?? "#8a8a8a";

  if (failed) {
    return (
      <span
        className="avatar avatar--ph"
        style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
      >
        {agent.name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      className="avatar"
      src={`/agents/${agent.id}.png`}
      width={size}
      height={size}
      alt={agent.name}
      onError={() => setFailed(true)}
    />
  );
}

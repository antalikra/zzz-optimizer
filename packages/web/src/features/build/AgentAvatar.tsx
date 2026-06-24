import { useState } from "react";
import type { Agent } from "../../domain/agents";

/**
 * Agent avatar. Uses the local image at `/agents/{id}.png`; on miss falls back to
 * an accent-colored initial tile (accent comes from Enka data, not hardcoded).
 */
export function AgentAvatar({ agent, size = 64 }: { agent: Agent; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="avatar avatar--ph"
        style={{ width: size, height: size, background: agent.accent, fontSize: size * 0.4 }}
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

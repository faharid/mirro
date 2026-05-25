"use client";

import { useEffect, useState } from "react";
import { listAgents } from "@/lib/api-client";
import { AGENT_META, type AgentId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getUserId } from "@/lib/storage";

interface AgentSelectorProps {
  value: AgentId;
  onChange: (id: AgentId) => void;
  disabled?: boolean;
}

export function AgentSelector({
  value,
  onChange,
  disabled,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<
    Array<{ id: string; label: string; type?: string }>
  >([]);

  useEffect(() => {
    listAgents(getUserId())
      .then((list) => {
        setAgents(
          list.map((a) => ({
            id: a.id,
            type: a.type,
            label:
              AGENT_META[a.id as keyof typeof AGENT_META]?.title ||
              a.name ||
              a.id,
          })),
        );
      })
      .catch(() => {
        setAgents(
          (["assistant", "support", "domain"] as const).map((id) => ({
            id,
            label: AGENT_META[id].title,
            type: "builtin",
          })),
        );
      });
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      {agents.map((agent) => {
        const active = value === agent.id;
        return (
          <button
            key={agent.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(agent.id)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              active
                ? "border-emerald-600/50 bg-emerald-600/10 text-emerald-400"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
              disabled && "opacity-50",
            )}
          >
            <span className="font-medium">{agent.label}</span>
            {agent.type === "clone" && (
              <span className="ml-2 text-xs text-emerald-600/80">clone</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

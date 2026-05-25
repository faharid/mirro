"use client";

import { useEffect, useState } from "react";
import { checkApiHealth } from "@/lib/api-client";
import { MobileNav } from "./mobile-nav";
import { Badge } from "@/components/ui/badge";
import { AGENT_META } from "@/lib/types";
import { getSelectedAgentId } from "@/lib/storage";

export function Header({ title }: { title: string }) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [agentLabel, setAgentLabel] = useState("Assistant");

  useEffect(() => {
    const agentId = getSelectedAgentId();
    setAgentLabel(AGENT_META[agentId]?.title || agentId);
  }, []);

  useEffect(() => {
    checkApiHealth().then(setOnline);
    const interval = setInterval(() => checkApiHealth().then(setOnline), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden sm:inline-flex">
          {agentLabel}
        </Badge>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span
            className={`h-2 w-2 rounded-full ${
              online === null
                ? "bg-zinc-500 animate-pulse"
                : online
                  ? "bg-emerald-500"
                  : "bg-red-500"
            }`}
          />
          {online === null ? "Checking..." : online ? "API online" : "API offline"}
        </div>
      </div>
    </header>
  );
}

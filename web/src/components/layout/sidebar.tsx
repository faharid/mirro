"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  BookOpen,
  Copy,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getSelectedAgentId } from "@/lib/storage";
import { AGENT_META } from "@/lib/types";

const nav = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/clones", label: "Clones", icon: Copy },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [agentName, setAgentName] = useState("Personal Assistant");

  useEffect(() => {
    const agentId = getSelectedAgentId();
    setAgentName(
      AGENT_META[agentId as keyof typeof AGENT_META]?.title || agentId,
    );
  }, [pathname]);

  return (
    <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-950 md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <Sparkles className="h-6 w-6 text-emerald-500" />
        <span className="font-semibold text-zinc-100">AI Clone Kit</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-600/15 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <p className="mb-2 text-xs text-zinc-500">Active agent</p>
        <Badge variant="secondary">{agentName}</Badge>
      </div>
    </aside>
  );
}

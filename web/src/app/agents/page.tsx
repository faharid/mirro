"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, ArrowRight, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAgents, useAgentDetail } from "@/hooks/use-agents";
import {
  createAgent,
  deleteAgent,
  updateAgent,
} from "@/lib/api-client";
import { AGENT_META, type AgentId } from "@/lib/types";
import { getUserId } from "@/lib/storage";
import { toast } from "sonner";

export default function AgentsPage() {
  const { agents, loading, error, refresh } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { agent: detail, loading: detailLoading } = useAgentDetail(selectedId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    systemPrompt: "",
    tools: "memory,search",
  });

  const isBuiltin = (id: string) =>
    ["assistant", "support", "domain"].includes(id);

  const handleCreate = async () => {
    try {
      await createAgent({
        name: form.name,
        systemPrompt: form.systemPrompt,
        tools: form.tools.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Agent created");
      setShowForm(false);
      setForm({ name: "", systemPrompt: "", tools: "memory,search" });
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgent(id);
      toast.success("Agent deleted");
      setSelectedId(null);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!selectedId || !detail?.systemPrompt) return;
    try {
      await updateAgent(selectedId, {
        systemPrompt: detail.systemPrompt,
      });
      toast.success("Agent updated");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <Header title="Agents" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {error && (
          <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
            {error}. Make sure the API is running on port 3001.
          </p>
        )}
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />
            Custom agent
          </Button>
        </div>
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create custom agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Name (unique id)</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>System prompt</Label>
                <Textarea
                  rows={4}
                  value={form.systemPrompt}
                  onChange={(e) =>
                    setForm({ ...form, systemPrompt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Tools (comma-separated)</Label>
                <Input
                  value={form.tools}
                  onChange={(e) =>
                    setForm({ ...form, tools: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleCreate}>Create</Button>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid gap-4">
            {(loading ? [] : agents).map((a) => {
              const meta = AGENT_META[a.id as AgentId];
              const title = meta?.title || a.name || a.id;
              const desc =
                meta?.description ||
                (a.type === "clone"
                  ? "Persona clone — chat in character"
                  : "Custom agent");
              return (
                <Card
                  key={a.id}
                  className={`cursor-pointer transition-colors hover:border-zinc-700 ${
                    selectedId === a.id ? "border-emerald-600/50" : ""
                  }`}
                  onClick={() => setSelectedId(a.id)}
                >
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="rounded-lg bg-emerald-600/15 p-3">
                      <Bot className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {title}
                        {a.type && (
                          <Badge variant="outline">{a.type}</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{desc}</CardDescription>
                      {meta?.useCases && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {meta.useCases.map((uc) => (
                            <Badge key={uc} variant="outline">
                              {uc}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/chat?agent=${encodeURIComponent(a.id)}`}>
                        Start chat
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    {a.type === "custom" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(a.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Agent details</CardTitle>
              <CardDescription>
                {selectedId
                  ? `Configuration for ${selectedId}`
                  : "Select an agent"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detailLoading && (
                <p className="text-sm text-zinc-500">Loading...</p>
              )}
              {detail && !detailLoading && (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">ID</dt>
                    <dd className="font-mono text-zinc-200">{detail.id}</dd>
                  </div>
                  {detail.provider && (
                    <div>
                      <dt className="text-zinc-500">Provider</dt>
                      <dd className="text-zinc-200">{detail.provider}</dd>
                    </div>
                  )}
                  {detail.model && (
                    <div>
                      <dt className="text-zinc-500">Model</dt>
                      <dd className="text-zinc-200">{detail.model}</dd>
                    </div>
                  )}
                  {detail.systemPrompt && !isBuiltin(selectedId || "") && (
                    <div>
                      <dt className="text-zinc-500">System prompt</dt>
                      <Textarea
                        className="mt-1 font-mono text-xs"
                        rows={6}
                        defaultValue={detail.systemPrompt}
                        onChange={(e) => {
                          detail.systemPrompt = e.target.value;
                        }}
                      />
                      <Button
                        className="mt-2"
                        size="sm"
                        onClick={handleUpdatePrompt}
                      >
                        Save prompt
                      </Button>
                    </div>
                  )}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          User: {getUserId().slice(0, 8)}… — clones listed when active
        </p>
      </div>
    </main>
  );
}

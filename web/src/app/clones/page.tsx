"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clones } from "@/lib/api-client";
import { getUserId } from "@/lib/storage";
import type { MirrorCard, PersonaClone } from "@/lib/types";
import { toast } from "sonner";

const SECTIONS = [
  {
    id: "identity",
    title: "Identity",
    fields: [
      { id: "fullName", label: "Full name", type: "text" },
      { id: "role", label: "Role / title", type: "text" },
      { id: "oneLineBio", label: "One-line bio", type: "text" },
    ],
  },
  {
    id: "personality",
    title: "Personality",
    fields: [
      { id: "traits", label: "Traits (comma-separated)", type: "text" },
      { id: "values", label: "Core values", type: "textarea" },
      { id: "humor", label: "Humor style", type: "text" },
      { id: "boundaries", label: "Boundaries", type: "textarea" },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    fields: [
      { id: "tone", label: "Tone", type: "text" },
      { id: "vocabulary", label: "Vocabulary", type: "textarea" },
      { id: "sentenceStyle", label: "Sentence style", type: "text" },
      { id: "samplePhrases", label: "Sample phrases", type: "textarea" },
    ],
  },
  {
    id: "expertise",
    title: "Expertise",
    fields: [
      { id: "expertise", label: "Expertise areas", type: "textarea" },
      { id: "opinions", label: "Opinions", type: "textarea" },
    ],
  },
] as const;

type Tab = "questionnaire" | "documents" | "interview" | "review";

export default function ClonesPage() {
  const [tab, setTab] = useState<Tab>("questionnaire");
  const [cloneList, setCloneList] = useState<PersonaClone[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [clone, setClone] = useState<PersonaClone | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [interviewMessages, setInterviewMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");

  const refreshList = useCallback(async () => {
    try {
      const list = await clones.list(getUserId());
      setCloneList(list);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const loadClone = async (id: string) => {
    const c = await clones.get(id);
    setActiveId(id);
    setClone(c);
    setAnswers((c.questionnaire as Record<string, string>) || {});
  };

  const createClone = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const c = await clones.create(newName.trim());
      setNewName("");
      await refreshList();
      await loadClone(c.id);
      toast.success("Clone draft created");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveQuestionnaire = async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      const updated = await clones.updateQuestionnaire(activeId, answers);
      setClone(updated);
      toast.success("Questionnaire saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async (file: File) => {
    if (!activeId) return;
    setLoading(true);
    try {
      const updated = await clones.uploadDocument(activeId, file);
      setClone(updated);
      toast.success("Document processed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendInterview = async (msg?: string) => {
    if (!activeId) return;
    setLoading(true);
    try {
      if (msg) {
        setInterviewMessages((prev) => [
          ...prev,
          { role: "user", content: msg },
        ]);
      }
      const result = await clones.interview(activeId, msg);
      setInterviewMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);
      if (result.complete) {
        toast.success("Interview complete");
        const updated = await clones.get(activeId);
        setClone(updated);
      }
      setInterviewInput("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateCard = async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      const updated = await clones.generateMirrorCard(activeId);
      setClone(updated);
      setTab("review");
      toast.success("Mirror card generated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const activate = async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      const { agentId } = await clones.activate(activeId);
      await refreshList();
      toast.success(`Activated as ${agentId}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const card = clone?.mirrorCard as MirrorCard | undefined;

  return (
    <main className="flex flex-1 flex-col">
      <Header title="Persona Clones" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-zinc-800 p-4">
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Display name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button size="sm" onClick={createClone} disabled={loading}>
              New
            </Button>
          </div>
          <ul className="space-y-2">
            {cloneList.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    activeId === c.id
                      ? "border-emerald-600/50 bg-emerald-600/10"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                  onClick={() => loadClone(c.id)}
                >
                  <span className="font-medium">{c.displayName}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {c.status}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {!activeId ? (
            <p className="text-zinc-500">Create or select a clone to begin.</p>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-2">
                {(
                  [
                    "questionnaire",
                    "documents",
                    "interview",
                    "review",
                  ] as Tab[]
                ).map((t) => (
                  <Button
                    key={t}
                    variant={tab === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>

              {tab === "questionnaire" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Questionnaire</CardTitle>
                    <CardDescription>
                      Build the persona profile step by step
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {SECTIONS.map((section) => (
                      <div key={section.id}>
                        <h3 className="mb-3 font-medium text-zinc-200">
                          {section.title}
                        </h3>
                        <div className="space-y-3">
                          {section.fields.map((f) => (
                            <div key={f.id}>
                              <Label>{f.label}</Label>
                              {f.type === "textarea" ? (
                                <Textarea
                                  className="mt-1"
                                  value={answers[f.id] || ""}
                                  onChange={(e) =>
                                    setAnswers({
                                      ...answers,
                                      [f.id]: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <Input
                                  className="mt-1"
                                  value={answers[f.id] || ""}
                                  onChange={(e) =>
                                    setAnswers({
                                      ...answers,
                                      [f.id]: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button onClick={saveQuestionnaire} disabled={loading}>
                      Save questionnaire
                    </Button>
                  </CardContent>
                </Card>
              )}

              {tab === "documents" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      Upload text files for personality extraction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="file"
                      accept=".txt,.md"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(file);
                      }}
                    />
                    {clone?.documentInsights &&
                      Array.isArray(clone.documentInsights) && (
                        <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
                          {JSON.stringify(clone.documentInsights, null, 2)}
                        </pre>
                      )}
                  </CardContent>
                </Card>
              )}

              {tab === "interview" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Interview</CardTitle>
                    <CardDescription>
                      Conversational profiling with an interviewer agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {interviewMessages.length === 0 && (
                      <Button
                        onClick={() => sendInterview()}
                        disabled={loading}
                      >
                        Start interview
                      </Button>
                    )}
                    <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 p-3">
                      {interviewMessages.map((m, i) => (
                        <p
                          key={i}
                          className={
                            m.role === "user"
                              ? "text-emerald-400"
                              : "text-zinc-300"
                          }
                        >
                          <strong>{m.role}:</strong> {m.content}
                        </p>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={interviewInput}
                        onChange={(e) => setInterviewInput(e.target.value)}
                        placeholder="Your answer..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && interviewInput.trim()) {
                            sendInterview(interviewInput.trim());
                          }
                        }}
                      />
                      <Button
                        onClick={() =>
                          interviewInput.trim() &&
                          sendInterview(interviewInput.trim())
                        }
                        disabled={loading || !interviewInput.trim()}
                      >
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tab === "review" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mirror card</CardTitle>
                    <CardDescription>
                      Review, generate, and activate your clone
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!card && (
                      <Button onClick={generateCard} disabled={loading}>
                        Generate mirror card
                      </Button>
                    )}
                    {card && (
                      <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-300">
                        {JSON.stringify(card, null, 2)}
                      </pre>
                    )}
                    {clone?.status === "ready" && (
                      <Button onClick={activate} disabled={loading}>
                        Activate clone
                      </Button>
                    )}
                    {clone?.status === "active" && (
                      <Button asChild>
                        <Link href={`/chat?agent=clone-${clone.id}`}>
                          Chat with clone
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

import { getSettings, getUserId } from "./storage";
import type {
  AgentConfig,
  AgentInfo,
  ConversationSummary,
  KnowledgeResult,
  MirrorCard,
  PersonaClone,
} from "./types";

function getBaseUrl(): string {
  const settings = typeof window !== "undefined" ? getSettings() : { apiBaseUrl: "" };
  if (settings.apiBaseUrl) {
    return settings.apiBaseUrl.replace(/\/$/, "");
  }
  return "";
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const res = await fetch(url, options);

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || JSON.stringify(body);
      if (Array.isArray(message)) message = message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res as unknown as T;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await listAgents();
    return true;
  } catch {
    return false;
  }
}

export async function listAgents(userId?: string): Promise<AgentInfo[]> {
  const uid = userId || getUserId();
  const data = await request<{ agents: AgentInfo[] }>(
    `/api/agents?userId=${encodeURIComponent(uid)}`,
  );
  return data.agents;
}

export async function getAgent(id: string): Promise<AgentConfig> {
  return request<AgentConfig>(`/api/agents/${id}`);
}

export async function createAgent(body: {
  name: string;
  systemPrompt: string;
  tools?: string[];
  model?: string;
  provider?: string;
}): Promise<AgentConfig> {
  return request("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, type: "custom" }),
  });
}

export async function updateAgent(
  id: string,
  body: Partial<{
    name: string;
    systemPrompt: string;
    tools: string[];
    model: string;
    provider: string;
  }>,
): Promise<AgentConfig> {
  return request(`/api/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteAgent(id: string): Promise<void> {
  await request(`/api/agents/${id}`, { method: "DELETE" });
}

export async function listConversations(
  userId?: string,
  agentId?: string,
): Promise<ConversationSummary[]> {
  const uid = userId || getUserId();
  let path = `/api/conversations?userId=${encodeURIComponent(uid)}`;
  if (agentId) path += `&agentId=${encodeURIComponent(agentId)}`;
  return request<ConversationSummary[]>(path);
}

export interface SendChatParams {
  message: string;
  agentId: string;
  userId: string;
  sync?: boolean;
}

export interface SyncChatResponse {
  response: string;
  agentId: string;
  userId: string;
  conversationId?: string;
  sync: true;
  shouldEscalate?: boolean;
}

export interface AsyncChatResponse {
  jobId: string;
  status: string;
  agentId: string;
  userId: string;
  conversationId?: string;
}

export async function sendChat(
  params: SendChatParams,
): Promise<SyncChatResponse | AsyncChatResponse> {
  const sync = params.sync !== false;
  const query = sync ? "?sync=true" : "";
  return request(`/api/chat${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      agentId: params.agentId,
      userId: params.userId,
    }),
  });
}

export async function pollJob(
  jobId: string,
  maxAttempts = 60,
): Promise<{
  response: string;
  status: string;
  shouldEscalate?: boolean;
  conversationId?: string;
}> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await request<{
      status: string;
      response?: string;
      shouldEscalate?: boolean;
      conversationId?: string;
    }>(`/api/chat/jobs/${jobId}`);

    if (result.status === "completed" && result.response) {
      return {
        response: result.response,
        status: "completed",
        shouldEscalate: result.shouldEscalate,
        conversationId: result.conversationId,
      };
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Job timed out waiting for response");
}

export async function getTokenUsage(userId?: string): Promise<{
  totalTokens: number;
}> {
  const uid = userId || getUserId();
  return request(`/api/usage?userId=${encodeURIComponent(uid)}`);
}

export const clones = {
  list(userId?: string): Promise<PersonaClone[]> {
    const uid = userId || getUserId();
    return request(`/api/clones?userId=${encodeURIComponent(uid)}`);
  },

  get(id: string, userId?: string): Promise<PersonaClone> {
    const uid = userId || getUserId();
    return request(
      `/api/clones/${id}?userId=${encodeURIComponent(uid)}`,
    );
  },

  create(displayName: string, userId?: string): Promise<PersonaClone> {
    const uid = userId || getUserId();
    return request("/api/clones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, userId: uid }),
    });
  },

  updateQuestionnaire(
    id: string,
    answers: Record<string, unknown>,
    userId?: string,
  ): Promise<PersonaClone> {
    const uid = userId || getUserId();
    return request(`/api/clones/${id}/questionnaire`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, userId: uid }),
    });
  },

  async uploadDocument(
    id: string,
    file: File,
    userId?: string,
  ): Promise<PersonaClone> {
    const uid = userId || getUserId();
    const form = new FormData();
    form.append("file", file);
    const base = getBaseUrl();
    const res = await fetch(
      `${base}/api/clones/${id}/documents?userId=${encodeURIComponent(uid)}`,
      { method: "POST", body: form },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Upload failed");
    }
    return res.json();
  },

  interview(
    id: string,
    message?: string,
    userId?: string,
  ): Promise<{ reply: string; complete: boolean }> {
    const uid = userId || getUserId();
    return request(`/api/clones/${id}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId: uid }),
    });
  },

  generateMirrorCard(id: string, userId?: string): Promise<PersonaClone> {
    const uid = userId || getUserId();
    return request(
      `/api/clones/${id}/generate-mirror-card?userId=${encodeURIComponent(uid)}`,
      { method: "POST" },
    );
  },

  activate(
    id: string,
    userId?: string,
  ): Promise<{ clone: PersonaClone; agentId: string }> {
    const uid = userId || getUserId();
    return request(
      `/api/clones/${id}/activate?userId=${encodeURIComponent(uid)}`,
      { method: "POST" },
    );
  },

  remove(id: string, userId?: string): Promise<void> {
    const uid = userId || getUserId();
    return request(
      `/api/clones/${id}?userId=${encodeURIComponent(uid)}`,
      { method: "DELETE" },
    );
  },
};

export async function searchKnowledge(
  q: string,
  topK = 5,
): Promise<KnowledgeResult[]> {
  const data = await request<{ results: KnowledgeResult[] }>(
    `/api/knowledge/search?q=${encodeURIComponent(q)}&topK=${topK}`,
  );
  return data.results;
}

export async function uploadKnowledge(file: File): Promise<{
  uploaded: string;
  chunks: number;
}> {
  const form = new FormData();
  form.append("file", file);
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/knowledge/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Upload failed");
  }
  return res.json();
}

export async function ingestKnowledge(path?: string): Promise<{
  status: string;
  chunks: number;
}> {
  return request("/api/knowledge/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(path ? { path } : {}),
  });
}

export async function synthesizeSpeech(
  text: string,
  provider?: string,
): Promise<Blob> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/voice/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, provider }),
  });
  if (!res.ok) {
    let message = "Speech synthesis failed";
    try {
      const err = await res.json();
      message = err.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.blob();
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/voice/transcribe`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error("Transcription failed");
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text || "";
}

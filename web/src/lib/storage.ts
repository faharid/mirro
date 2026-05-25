import type { AgentId, AppSettings, ChatMessage } from "./types";

const KEYS = {
  userId: "ack_userId",
  agentId: "ack_agentId",
  settings: "ack_settings",
  chatPrefix: "ack_chat_",
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: "",
  syncMode: true,
  ttsProvider: "elevenlabs",
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getUserId(): string {
  if (!isBrowser()) return "anonymous";
  let id = localStorage.getItem(KEYS.userId);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEYS.userId, id);
  }
  return id;
}

export function setUserId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.userId, id);
}

export function regenerateUserId(): string {
  const id = crypto.randomUUID();
  setUserId(id);
  return id;
}

export function getSelectedAgentId(): AgentId {
  if (!isBrowser()) return "assistant";
  const id = localStorage.getItem(KEYS.agentId);
  return id || "assistant";
}

export function setSelectedAgentId(id: AgentId): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.agentId, id);
}

export function getSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export function getChatHistory(agentId: AgentId): ChatMessage[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(`${KEYS.chatPrefix}${agentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(
  agentId: AgentId,
  messages: ChatMessage[],
): void {
  if (!isBrowser()) return;
  localStorage.setItem(
    `${KEYS.chatPrefix}${agentId}`,
    JSON.stringify(messages),
  );
}

export function clearChatHistory(agentId: AgentId): void {
  if (!isBrowser()) return;
  localStorage.removeItem(`${KEYS.chatPrefix}${agentId}`);
}

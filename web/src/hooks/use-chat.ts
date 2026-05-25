"use client";

import { useCallback, useEffect, useState } from "react";
import { listConversations, pollJob, sendChat } from "@/lib/api-client";
import {
  clearChatHistory,
  getChatHistory,
  getSelectedAgentId,
  getSettings,
  getUserId,
  saveChatHistory,
  setSelectedAgentId,
} from "@/lib/storage";
import type { AgentId, ChatMessage, ConversationSummary } from "@/lib/types";
import { toast } from "sonner";

export function useChat(initialAgent?: string) {
  const [agentId, setAgentId] = useState<AgentId>(
    initialAgent ?? "assistant",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [shouldEscalate, setShouldEscalate] = useState(false);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await listConversations(getUserId(), agentId);
      setConversations(list);
    } catch {
      setConversations([]);
    }
  }, [agentId]);

  useEffect(() => {
    const id = initialAgent ?? getSelectedAgentId();
    setAgentId(id);
    if (initialAgent) setSelectedAgentId(initialAgent);
    setMessages(getChatHistory(id));
    setHydrated(true);
  }, [initialAgent]);

  useEffect(() => {
    if (!hydrated) return;
    setMessages(getChatHistory(agentId));
    refreshConversations();
  }, [agentId, hydrated, refreshConversations]);

  const changeAgent = useCallback((id: AgentId) => {
    setSelectedAgentId(id);
    setAgentId(id);
    setMessages(getChatHistory(id));
    setShouldEscalate(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const next = [...messages, userMsg];
      setMessages(next);
      saveChatHistory(agentId, next);
      setLoading(true);
      setShouldEscalate(false);

      try {
        const settings = getSettings();
        const userId = getUserId();
        const result = await sendChat({
          message: content.trim(),
          agentId,
          userId,
          sync: settings.syncMode,
        });

        let responseText: string;
        let escalate = false;

        if ("response" in result && result.response) {
          responseText = result.response;
          escalate = !!result.shouldEscalate;
        } else if ("jobId" in result) {
          const polled = await pollJob(result.jobId);
          responseText = polled.response;
          escalate = !!polled.shouldEscalate;
        } else {
          throw new Error("Unexpected response from API");
        }

        setShouldEscalate(escalate);

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseText,
          timestamp: Date.now(),
          shouldEscalate: escalate,
        };

        const updated = [...next, assistantMsg];
        setMessages(updated);
        saveChatHistory(agentId, updated);
        refreshConversations();
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [agentId, loading, messages, refreshConversations],
  );

  const clearChat = useCallback(() => {
    clearChatHistory(agentId);
    setMessages([]);
    setShouldEscalate(false);
    toast.success("Chat cleared");
  }, [agentId]);

  return {
    agentId,
    messages,
    loading,
    conversations,
    shouldEscalate,
    changeAgent,
    sendMessage,
    clearChat,
    refreshConversations,
  };
}

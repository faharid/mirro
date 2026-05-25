"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { AgentSelector } from "@/components/chat/agent-selector";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { useChat } from "@/hooks/use-chat";
import { useVoice } from "@/hooks/use-voice";
import type { AgentId } from "@/lib/types";

function ChatContent() {
  const searchParams = useSearchParams();
  const agentParam = searchParams.get("agent");
  const {
    agentId,
    messages,
    loading,
    conversations,
    shouldEscalate,
    changeAgent,
    sendMessage,
    clearChat,
  } = useChat(agentParam || undefined);
  const { recording, playing, startRecording, stopRecording, playText } =
    useVoice();

  useEffect(() => {
    if (agentParam) {
      changeAgent(agentParam as AgentId);
    }
  }, [agentParam, changeAgent]);

  return (
    <>
      <Header title="Chat" />
      {shouldEscalate && (
        <div className="border-b border-amber-900/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-200 md:px-6">
          Support escalation suggested — consider routing to a human agent.
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-800 bg-zinc-950/50 p-3 lg:block">
          <p className="mb-2 text-xs font-medium text-zinc-500">Conversations</p>
          <ul className="space-y-1 text-xs text-zinc-400">
            {conversations.length === 0 && (
              <li className="text-zinc-600">No server history yet</li>
            )}
            {conversations.map((c) => (
              <li
                key={c.id}
                className="truncate rounded px-2 py-1 hover:bg-zinc-800"
                title={c.id}
              >
                {new Date(c.updatedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-zinc-800 px-4 py-3 md:px-6">
            <AgentSelector
              value={agentId}
              onChange={changeAgent}
              disabled={loading}
            />
          </div>
          <MessageList
            messages={messages}
            loading={loading}
            onPlayAudio={playText}
            playing={playing}
          />
          <ChatInput
            onSend={sendMessage}
            onClear={clearChat}
            loading={loading}
            recording={recording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
        <ChatContent />
      </Suspense>
    </main>
  );
}

"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  onPlayAudio?: (text: string) => void;
  playing?: boolean;
}

export function MessageList({
  messages,
  loading,
  onPlayAudio,
  playing,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-medium text-zinc-300">Start a conversation</p>
        <p className="max-w-md text-sm text-zinc-500">
          Ask anything. The agent uses memory, RAG knowledge, and tools when
          needed. Try voice input with the microphone button.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              msg.role === "user"
                ? "bg-emerald-600 text-white"
                : "border border-zinc-800 bg-zinc-900 text-zinc-100",
            )}
          >
            {msg.role === "assistant" ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )}
            {msg.role === "assistant" && onPlayAudio && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 gap-1 text-zinc-400 hover:text-emerald-400"
                onClick={() => onPlayAudio(msg.content)}
                disabled={playing}
              >
                <Volume2 className="h-3.5 w-3.5" />
                Listen
              </Button>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

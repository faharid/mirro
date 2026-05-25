"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Mic, MicOff, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  onClear?: () => void;
  loading?: boolean;
  recording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => Promise<string>;
}

export function ChatInput({
  onSend,
  onClear,
  loading,
  recording,
  onStartRecording,
  onStopRecording,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMic = async () => {
    if (!onStartRecording || !onStopRecording) return;
    if (recording) {
      const text = await onStopRecording();
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message the agent... (Enter to send, Shift+Enter for new line)"
          disabled={loading}
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {onStartRecording && (
              <Button
                type="button"
                variant={recording ? "destructive" : "outline"}
                size="icon"
                onClick={handleMic}
                disabled={loading}
                title={recording ? "Stop recording" : "Voice input"}
              >
                {recording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            {onClear && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClear}
                disabled={loading}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTokenUsage } from "@/lib/api-client";
import {
  DEFAULT_SETTINGS,
  getSettings,
  getUserId,
  regenerateUserId,
  saveSettings,
  setUserId,
} from "@/lib/storage";
import type { AppSettings } from "@/lib/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [userId, setUserIdState] = useState("");
  const [totalTokens, setTotalTokens] = useState<number | null>(null);

  useEffect(() => {
    setUserIdState(getUserId());
    setSettings(getSettings());
    getTokenUsage()
      .then((u) => setTotalTokens(u.totalTokens))
      .catch(() => setTotalTokens(null));
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    toast.success("Settings saved");
  };

  return (
    <main className="flex flex-1 flex-col">
      <Header title="Settings" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>API connection</CardTitle>
            <CardDescription>
              Leave empty to use the dev proxy (/api → localhost:3001). Set a
              full URL only for direct calls (requires CORS on backend).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiUrl">API base URL</Label>
              <Input
                id="apiUrl"
                className="mt-2"
                placeholder="http://localhost:3001 (optional)"
                value={settings.apiBaseUrl}
                onChange={(e) =>
                  setSettings({ ...settings, apiBaseUrl: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User identity</CardTitle>
            <CardDescription>
              Sent as userId on chat requests for memory persistence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                className="mt-2 font-mono text-xs"
                value={userId}
                onChange={(e) => setUserIdState(e.target.value)}
                onBlur={() => setUserId(userId)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const id = regenerateUserId();
                setUserIdState(id);
                toast.success("New user ID generated");
              }}
            >
              Regenerate user ID
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sync mode</Label>
                <p className="text-sm text-zinc-500">
                  Wait for response inline. Off = async queue + polling
                </p>
              </div>
              <Switch
                checked={settings.syncMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, syncMode: checked })
                }
              />
            </div>
            <div>
              <Label htmlFor="tts">TTS provider</Label>
              <select
                id="tts"
                className="mt-2 flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                value={settings.ttsProvider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ttsProvider: e.target.value as AppSettings["ttsProvider"],
                  })
                }
              >
                <option value="elevenlabs">ElevenLabs</option>
                <option value="deepgram">Deepgram</option>
                <option value="google">Google Cloud</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token usage</CardTitle>
            <CardDescription>
              Accumulated LLM tokens for this user (server-side)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-semibold text-zinc-100">
              {totalTokens !== null
                ? totalTokens.toLocaleString()
                : "—"}
            </p>
            <div>
              <Label htmlFor="budget">Token budget (optional)</Label>
              <Input
                id="budget"
                type="number"
                className="mt-2"
                placeholder="e.g. 100000"
                value={settings.tokenBudget ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tokenBudget: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
              <p className="mt-1 text-xs text-zinc-500">
                Send as X-Token-Budget header when calling API directly
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend API keys</CardTitle>
            <CardDescription>
              LLM and voice keys are configured in the backend{" "}
              <code className="text-emerald-500">mirro/.env</code> file (OPENAI,
              GROQ, ANTHROPIC, ELEVENLABS, etc.)
            </CardDescription>
          </CardHeader>
        </Card>

        <Button onClick={handleSave} className="w-full">
          Save settings
        </Button>
      </div>
    </main>
  );
}

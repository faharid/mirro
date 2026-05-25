"use client";

import { useState, useRef } from "react";
import { Search, Upload, Database, FileText } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  searchKnowledge,
  uploadKnowledge,
  ingestKnowledge,
} from "@/lib/api-client";
import type { KnowledgeResult } from "@/lib/types";
import { toast } from "sonner";

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await searchKnowledge(query.trim());
      setResults(data);
      if (data.length === 0) toast.info("No results found");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadKnowledge(file);
      toast.success(`Uploaded ${res.uploaded} (${res.chunks} chunks)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await ingestKnowledge();
      toast.success(`Ingested ${res.chunks} chunks from default docs`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <Header title="Knowledge Base" />
      <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-500" />
              Semantic search
            </CardTitle>
            <CardDescription>
              Search embedded documents in pgvector
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your docs..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload document
              </CardTitle>
              <CardDescription>Markdown, JSON, or PDF</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".md,.json,.pdf,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Choose file"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Ingest default docs
              </CardTitle>
              <CardDescription>
                Process example-doc.md and faq.json from the repo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleIngest} disabled={ingesting}>
                {ingesting ? "Ingesting..." : "Ingest default docs"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-zinc-400">
              Results ({results.length})
            </h2>
            {results.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-500" />
                    {r.source && (
                      <Badge variant="outline">{r.source}</Badge>
                    )}
                    <Badge variant="secondary">
                      score: {r.score.toFixed(3)}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {r.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

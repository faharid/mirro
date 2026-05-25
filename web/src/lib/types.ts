export type BuiltinAgentId = "assistant" | "support" | "domain";
export type AgentId = BuiltinAgentId | string;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  shouldEscalate?: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  type?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
  tools?: string[];
  type?: string;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MirrorCard {
  identity: {
    name: string;
    archetype: string;
    oneLineBio: string;
  };
  personality: {
    traits: string[];
    values: string[];
    communicationStyle: string;
    humor: string;
    boundaries: string[];
  };
  speechPatterns: {
    vocabulary: string[];
    sentenceStyle: string;
    samplePhrases: string[];
  };
  knowledge: {
    expertise: string[];
    opinions: string[];
  };
  interviewHighlights: string[];
  systemPrompt?: string;
}

export interface PersonaClone {
  id: string;
  userId: string;
  displayName: string;
  status: "draft" | "interview" | "ready" | "active";
  questionnaire?: Record<string, unknown>;
  mirrorCard?: MirrorCard | Record<string, unknown>;
  documentInsights?: unknown[];
  interviewComplete?: boolean;
  agentConfigId?: string;
}

export interface KnowledgeResult {
  id: string;
  text: string;
  source?: string;
  score: number;
}

export interface AppSettings {
  apiBaseUrl: string;
  syncMode: boolean;
  ttsProvider: "elevenlabs" | "deepgram" | "google";
  tokenBudget?: number;
}

export const AGENT_META: Record<
  BuiltinAgentId,
  { title: string; description: string; useCases: string[] }
> = {
  assistant: {
    title: "Personal Assistant",
    description: "General-purpose AI with memory, tools, and web search.",
    useCases: ["Daily tasks", "Reminders", "Research"],
  },
  support: {
    title: "Customer Support",
    description: "Answers from your knowledge base and FAQ with empathy.",
    useCases: ["Billing", "Product help", "Escalations"],
  },
  domain: {
    title: "Domain Expert",
    description: "Specialized answers with citations from your documents.",
    useCases: ["Finance", "Legal", "Technical docs"],
  },
};

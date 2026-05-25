export interface MirrorCard {
  identity: {
    name: string;
    archetype?: string;
    oneLineBio: string;
  };
  personality: {
    traits: string[];
    values: string[];
    communicationStyle: string;
    humor?: string;
    boundaries?: string[];
  };
  speechPatterns: {
    vocabulary?: string[];
    sentenceStyle?: string;
    samplePhrases: string[];
  };
  knowledge?: {
    expertise?: string[];
    opinions?: string[];
  };
  interviewHighlights?: string[];
  systemPrompt: string;
}

export function parseMirrorCard(raw: unknown): MirrorCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.systemPrompt !== 'string') return null;
  return raw as MirrorCard;
}

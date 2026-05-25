import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { ConfigService } from '@nestjs/config';
import { MirrorCard, parseMirrorCard } from './mirror-card.types';

@Injectable()
export class MirrorCardService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  buildSystemPromptFromCard(card: MirrorCard): string {
    if (card.systemPrompt?.trim()) return card.systemPrompt.trim();
    return `You are ${card.identity.name}. ${card.identity.oneLineBio}
Traits: ${card.personality.traits.join(', ')}
Values: ${card.personality.values.join(', ')}
Communication: ${card.personality.communicationStyle}
Sample phrases: ${card.speechPatterns.samplePhrases.join('; ')}
Stay in character. Never say you are an AI.`;
  }

  async synthesize(input: {
    displayName: string;
    questionnaire: Record<string, unknown>;
    documentInsights: unknown[];
    interviewTranscript: string;
  }): Promise<MirrorCard> {
    const prompt = `You are an expert persona analyst. Create a "mirror card" JSON profile for a digital clone.

Display name: ${input.displayName}

Questionnaire answers:
${JSON.stringify(input.questionnaire, null, 2)}

Document insights:
${JSON.stringify(input.documentInsights, null, 2)}

Interview transcript:
${input.interviewTranscript}

Return ONLY valid JSON with this structure:
{
  "identity": { "name": string, "archetype": string, "oneLineBio": string },
  "personality": { "traits": string[], "values": string[], "communicationStyle": string, "humor": string, "boundaries": string[] },
  "speechPatterns": { "vocabulary": string[], "sentenceStyle": string, "samplePhrases": string[] },
  "knowledge": { "expertise": string[], "opinions": string[] },
  "interviewHighlights": string[],
  "systemPrompt": "detailed system prompt in first person for the clone to use in chat"
}`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      provider: this.config.get('llm.defaultProvider'),
      model: this.config.get('llm.defaultModel'),
      temperature: 0.4,
      maxTokens: 4000,
    });

    return this.parseJsonResponse(response.text);
  }

  private parseJsonResponse(text: string): MirrorCard {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse mirror card JSON from LLM');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Invalid JSON in mirror card response');
    }
    const card = parseMirrorCard(parsed);
    if (!card) {
      throw new Error('Mirror card missing required fields');
    }
    card.systemPrompt = this.buildSystemPromptFromCard(card);
    return card;
  }
}

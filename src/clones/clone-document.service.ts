import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmService } from '../llm/llm.service';
import { ConfigService } from '@nestjs/config';
import { CloneDocumentEntity } from '../database/entities/clone-document.entity';
import { PersonaCloneEntity } from '../database/entities/persona-clone.entity';

@Injectable()
export class CloneDocumentService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
    @InjectRepository(CloneDocumentEntity)
    private readonly docRepo: Repository<CloneDocumentEntity>,
    @InjectRepository(PersonaCloneEntity)
    private readonly cloneRepo: Repository<PersonaCloneEntity>,
  ) {}

  async processUpload(
    clone: PersonaCloneEntity,
    filename: string,
    content: string,
  ): Promise<CloneDocumentEntity> {
    const excerpt = content.slice(0, 12000);

    const response = await this.llm.chat({
      messages: [
        {
          role: 'system',
          content:
            'Extract personality signals from text for a digital persona clone. Return JSON: { traits, values, speechPatterns, opinions, expertise }',
        },
        {
          role: 'user',
          content: `Analyze writing from ${clone.displayName}:\n\n${excerpt}`,
        },
      ],
      provider: this.config.get('llm.defaultProvider'),
      model: this.config.get('llm.defaultModel'),
    });

    let insights: Record<string, unknown> = { raw: response.text };
    try {
      const match = response.text.match(/\{[\s\S]*\}/);
      if (match) insights = JSON.parse(match[0]);
    } catch {
      // keep raw
    }

    const doc = await this.docRepo.save({
      cloneId: clone.id,
      filename,
      content: excerpt,
      insights,
    });

    const allInsights = await this.docRepo.find({
      where: { cloneId: clone.id },
    });
    clone.documentInsights = allInsights.map((d) => ({
      filename: d.filename,
      insights: d.insights,
    }));
    await this.cloneRepo.save(clone);

    return doc;
  }
}

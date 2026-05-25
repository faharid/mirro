import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonaCloneEntity } from '../database/entities/persona-clone.entity';
import { AgentConfigEntity } from '../database/entities/agent-config.entity';
import { getQuestionnaireTemplate } from './questionnaire.schema';
import { MirrorCardService } from './mirror-card.service';
import { CloneInterviewService } from './clone-interview.service';
import { CloneDocumentService } from './clone-document.service';
import { MirrorCard } from './mirror-card.types';

@Injectable()
export class ClonesService {
  constructor(
    @InjectRepository(PersonaCloneEntity)
    private readonly cloneRepo: Repository<PersonaCloneEntity>,
    @InjectRepository(AgentConfigEntity)
    private readonly agentRepo: Repository<AgentConfigEntity>,
    private readonly mirrorCardService: MirrorCardService,
    private readonly interviewService: CloneInterviewService,
    private readonly documentService: CloneDocumentService,
  ) {}

  async create(userId: string, displayName: string): Promise<PersonaCloneEntity> {
    return this.cloneRepo.save({
      userId,
      displayName,
      status: 'draft',
      questionnaire: getQuestionnaireTemplate(),
      documentInsights: [],
      interviewComplete: false,
    });
  }

  async findAll(userId: string): Promise<PersonaCloneEntity[]> {
    return this.cloneRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<PersonaCloneEntity> {
    const clone = await this.cloneRepo.findOne({ where: { id } });
    if (!clone || (userId && clone.userId !== userId)) {
      throw new NotFoundException(`Clone not found: ${id}`);
    }
    return clone;
  }

  async updateQuestionnaire(
    id: string,
    userId: string,
    answers: Record<string, unknown>,
  ): Promise<PersonaCloneEntity> {
    const clone = await this.findOne(id, userId);
    clone.questionnaire = { ...clone.questionnaire, ...answers };
    return this.cloneRepo.save(clone);
  }

  async uploadDocument(
    id: string,
    userId: string,
    filename: string,
    content: string,
  ) {
    const clone = await this.findOne(id, userId);
    return this.documentService.processUpload(clone, filename, content);
  }

  async interview(
    id: string,
    userId: string,
    message?: string,
  ): Promise<{ reply: string; complete: boolean }> {
    const clone = await this.findOne(id, userId);
    if (!message) {
      const reply = await this.interviewService.startInterview(clone);
      return { reply, complete: false };
    }
    return this.interviewService.handleUserMessage(clone, message);
  }

  async generateMirrorCard(id: string, userId: string): Promise<PersonaCloneEntity> {
    const clone = await this.findOne(id, userId);
    const transcript = await this.interviewService.getTranscript(clone.id);

    const card = await this.mirrorCardService.synthesize({
      displayName: clone.displayName,
      questionnaire: clone.questionnaire,
      documentInsights: clone.documentInsights || [],
      interviewTranscript: transcript || 'No interview conducted.',
    });

    clone.mirrorCard = card as unknown as Record<string, unknown>;
    clone.status = 'ready';
    return this.cloneRepo.save(clone);
  }

  async activate(id: string, userId: string): Promise<{
    clone: PersonaCloneEntity;
    agentId: string;
  }> {
    const clone = await this.findOne(id, userId);
    if (!clone.mirrorCard) {
      throw new BadRequestException('Generate mirror card first');
    }

    const card = clone.mirrorCard as unknown as MirrorCard;
    const systemPrompt = this.mirrorCardService.buildSystemPromptFromCard(card);
    const agentId = `clone-${clone.id}`;

    let agent = clone.agentConfigId
      ? await this.agentRepo.findOne({ where: { id: clone.agentConfigId } })
      : null;

    if (agent) {
      agent.systemPrompt = systemPrompt;
      agent.name = agentId;
      await this.agentRepo.save(agent);
    } else {
      agent = await this.agentRepo.save({
        name: agentId,
        type: 'clone',
        systemPrompt,
        tools: ['memory'],
        model: 'gpt-4o-mini',
        provider: 'openai',
        cloneId: clone.id,
      });
      clone.agentConfigId = agent.id;
    }

    clone.status = 'active';
    await this.cloneRepo.save(clone);

    return { clone, agentId };
  }

  async remove(id: string, userId: string): Promise<void> {
    const clone = await this.findOne(id, userId);
    await this.cloneRepo.delete({ id: clone.id });
  }
}

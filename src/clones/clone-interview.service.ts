import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmService } from '../llm/llm.service';
import { ConfigService } from '@nestjs/config';
import { CloneInterviewMessageEntity } from '../database/entities/clone-interview-message.entity';
import { PersonaCloneEntity } from '../database/entities/persona-clone.entity';

const INTERVIEW_SYSTEM = `You are a skilled persona interviewer building a "mirror card" profile.
Ask one thoughtful question at a time about personality, values, communication style, humor, and speech patterns.
Keep responses under 120 words. After 8-12 user answers, say exactly: [INTERVIEW_COMPLETE]
Do not roleplay as the person being cloned — you are the interviewer.`;

@Injectable()
export class CloneInterviewService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
    @InjectRepository(CloneInterviewMessageEntity)
    private readonly msgRepo: Repository<CloneInterviewMessageEntity>,
    @InjectRepository(PersonaCloneEntity)
    private readonly cloneRepo: Repository<PersonaCloneEntity>,
  ) {}

  async startInterview(clone: PersonaCloneEntity): Promise<string> {
    const existing = await this.msgRepo.count({ where: { cloneId: clone.id } });
    if (existing > 0) {
      const last = await this.msgRepo.findOne({
        where: { cloneId: clone.id, role: 'interviewer' },
        order: { createdAt: 'DESC' },
      });
      return last?.content || 'Continue the interview.';
    }

    const greeting = await this.llm.chat({
      messages: [
        { role: 'system', content: INTERVIEW_SYSTEM },
        {
          role: 'user',
          content: `Start interviewing to build a mirror card for "${clone.displayName}". Ask your first question.`,
        },
      ],
      provider: this.config.get('llm.defaultProvider'),
      model: this.config.get('llm.defaultModel'),
    });

    await this.msgRepo.save({
      cloneId: clone.id,
      role: 'interviewer',
      content: greeting.text,
    });

    if (clone.status === 'draft') {
      clone.status = 'interview';
      await this.cloneRepo.save(clone);
    }

    return greeting.text;
  }

  async handleUserMessage(
    clone: PersonaCloneEntity,
    userMessage: string,
  ): Promise<{ reply: string; complete: boolean }> {
    await this.msgRepo.save({
      cloneId: clone.id,
      role: 'user',
      content: userMessage,
    });

    const history = await this.msgRepo.find({
      where: { cloneId: clone.id },
      order: { createdAt: 'ASC' },
    });

    const messages = [
      { role: 'system' as const, content: INTERVIEW_SYSTEM },
      ...history.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await this.llm.chat({
      messages,
      provider: this.config.get('llm.defaultProvider'),
      model: this.config.get('llm.defaultModel'),
    });

    const complete = response.text.includes('[INTERVIEW_COMPLETE]');
    const reply = response.text.replace('[INTERVIEW_COMPLETE]', '').trim();

    await this.msgRepo.save({
      cloneId: clone.id,
      role: 'interviewer',
      content: reply,
    });

    if (complete) {
      clone.interviewComplete = true;
      await this.cloneRepo.save(clone);
    }

    return { reply, complete };
  }

  async getTranscript(cloneId: string): Promise<string> {
    const history = await this.msgRepo.find({
      where: { cloneId },
      order: { createdAt: 'ASC' },
    });
    return history
      .map((m) => `${m.role === 'user' ? 'Subject' : 'Interviewer'}: ${m.content}`)
      .join('\n');
  }
}

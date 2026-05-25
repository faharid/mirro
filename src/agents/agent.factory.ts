import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssistantAgent } from './assistant-agent';
import { SupportAgent } from './support-agent';
import { DomainAgent } from './domain-agent';
import { IAgent } from './agent.interface';
import { AgentConfigEntity } from '../database/entities/agent-config.entity';
import { PersonaCloneEntity } from '../database/entities/persona-clone.entity';
import { DynamicAgent } from './dynamic-agent';
import { LlmService } from '../llm/llm.service';
import { MemoryService } from '../memory/memory.service';
import { RagService } from '../rag/rag.service';
import { ContextManager } from '../memory/context-manager';
import { ToolExecutor } from './tools/tool-executor';
import { ConfigService } from '@nestjs/config';
import { MirrorCardService } from '../clones/mirror-card.service';
import { MirrorCard } from '../clones/mirror-card.types';
import { ToolDefinition } from '../llm/types/tool';

@Injectable()
export class AgentFactory {
  private readonly builtin: Map<string, IAgent>;

  constructor(
    assistant: AssistantAgent,
    support: SupportAgent,
    domain: DomainAgent,
    private readonly llmService: LlmService,
    private readonly memoryService: MemoryService,
    private readonly ragService: RagService,
    private readonly contextManager: ContextManager,
    private readonly toolExecutor: ToolExecutor,
    private readonly config: ConfigService,
    private readonly mirrorCardService: MirrorCardService,
    @InjectRepository(AgentConfigEntity)
    private readonly agentRepo: Repository<AgentConfigEntity>,
    @InjectRepository(PersonaCloneEntity)
    private readonly cloneRepo: Repository<PersonaCloneEntity>,
  ) {
    this.builtin = new Map<string, IAgent>([
      ['assistant', assistant],
      ['support', support],
      ['domain', domain],
    ]);
  }

  async create(agentId: string): Promise<IAgent> {
    const builtin = this.builtin.get(agentId);
    if (builtin) return builtin;

    if (agentId.startsWith('clone-')) {
      const cloneId = agentId.replace('clone-', '');
      const clone = await this.cloneRepo.findOne({ where: { id: cloneId } });
      if (!clone?.mirrorCard) {
        throw new NotFoundException(`Clone not ready: ${cloneId}`);
      }
      const card = clone.mirrorCard as unknown as MirrorCard;
      const systemPrompt = this.mirrorCardService.buildSystemPromptFromCard(card);

      return new DynamicAgent(
        agentId,
        clone.displayName,
        systemPrompt,
        [{ name: 'memory', description: 'Recall conversations' }],
        undefined,
        undefined,
        this.llmService,
        this.memoryService,
        this.ragService,
        this.contextManager,
        this.toolExecutor,
        this.config,
        false,
      );
    }

    const byName = await this.agentRepo.findOne({ where: { name: agentId } });
    if (byName) return this.agentFromConfig(byName);

    const byId = await this.agentRepo.findOne({ where: { id: agentId } });
    if (byId) return this.agentFromConfig(byId);

    throw new NotFoundException(`Agent not found: ${agentId}`);
  }

  private agentFromConfig(config: AgentConfigEntity): DynamicAgent {
    const tools: ToolDefinition[] = (config.tools || []).map((name) => ({
      name,
      description: `Tool: ${name}`,
    }));

    return new DynamicAgent(
      config.name,
      config.name,
      config.systemPrompt,
      tools,
      config.provider,
      config.model,
      this.llmService,
      this.memoryService,
      this.ragService,
      this.contextManager,
      this.toolExecutor,
      this.config,
      config.type === 'custom',
    );
  }

  async list(
    userId?: string,
  ): Promise<Array<{ id: string; name: string; type: string }>> {
    const builtIn = Array.from(this.builtin.values()).map((a) => ({
      id: a.id,
      name: a.getConfig().name,
      type: 'builtin',
    }));

    const customs = await this.agentRepo.find({ take: 50 });

    const clones = userId
      ? await this.cloneRepo.find({ where: { userId, status: 'active' } })
      : await this.cloneRepo.find({ where: { status: 'active' }, take: 50 });

    return [
      ...builtIn,
      ...customs
        .filter((c) => c.type === 'custom')
        .map((c) => ({ id: c.name, name: c.name, type: 'custom' })),
      ...clones.map((c) => ({
        id: `clone-${c.id}`,
        name: c.displayName,
        type: 'clone',
      })),
    ];
  }
}

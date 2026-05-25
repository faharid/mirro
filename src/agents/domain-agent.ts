import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { MemoryService } from '../memory/memory.service';
import { RagService } from '../rag/rag.service';
import { ContextManager } from '../memory/context-manager';
import { ToolDefinition } from '../llm/types/tool';

@Injectable()
export class DomainAgent extends BaseAgent {
  readonly id = 'domain';
  readonly promptFile = 'domain.prompt';
  readonly tools: ToolDefinition[] = [
    { name: 'search', description: 'Search domain knowledge base' },
    { name: 'calculate', description: 'Financial or numeric calculations' },
  ];

  constructor(
    llmService: LlmService,
    memoryService: MemoryService,
    ragService: RagService,
    contextManager: ContextManager,
    config: ConfigService,
  ) {
    super(llmService, memoryService, ragService, contextManager, config);
  }

  isKnowledgeQuestion(): boolean {
    return true;
  }
}

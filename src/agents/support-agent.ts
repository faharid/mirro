import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { MemoryService } from '../memory/memory.service';
import { RagService } from '../rag/rag.service';
import { ContextManager } from '../memory/context-manager';
import { ToolDefinition } from '../llm/types/tool';

@Injectable()
export class SupportAgent extends BaseAgent {
  readonly id = 'support';
  readonly promptFile = 'support.prompt';
  readonly tools: ToolDefinition[] = [
    { name: 'search', description: 'Search knowledge base and web' },
  ];
  protected useRagByDefault = true;

  constructor(
    llmService: LlmService,
    memoryService: MemoryService,
    ragService: RagService,
    contextManager: ContextManager,
    config: ConfigService,
  ) {
    super(llmService, memoryService, ragService, contextManager, config);
  }

  isKnowledgeQuestion(message: string): boolean {
    return true;
  }
}

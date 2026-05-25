import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { MemoryService } from '../memory/memory.service';
import { RagService } from '../rag/rag.service';
import { ContextManager } from '../memory/context-manager';
import { ToolDefinition } from '../llm/types/tool';

@Injectable()
export class AssistantAgent extends BaseAgent {
  readonly id = 'assistant';
  readonly promptFile = 'assistant.prompt';
  readonly tools: ToolDefinition[] = [
    { name: 'search', description: 'Search the web for information' },
    { name: 'calculate', description: 'Perform mathematical calculations' },
    { name: 'memory', description: 'Recall past conversations' },
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
}

import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { MemoryModule } from '../memory/memory.module';
import { RagModule } from '../rag/rag.module';
import { DatabaseModule } from '../database/database.module';
import { ClonesModule } from '../clones/clones.module';
import { AssistantAgent } from './assistant-agent';
import { SupportAgent } from './support-agent';
import { DomainAgent } from './domain-agent';
import { AgentFactory } from './agent.factory';
import { ToolExecutor } from './tools/tool-executor';

@Module({
  imports: [DatabaseModule, LlmModule, MemoryModule, RagModule, ClonesModule],
  providers: [
    ToolExecutor,
    AssistantAgent,
    SupportAgent,
    DomainAgent,
    AgentFactory,
  ],
  exports: [AgentFactory, AssistantAgent, SupportAgent, DomainAgent],
})
export class AgentsModule {}

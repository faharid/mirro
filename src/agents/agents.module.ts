import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { MemoryModule } from '../memory/memory.module';
import { RagModule } from '../rag/rag.module';
import { AssistantAgent } from './assistant-agent';
import { SupportAgent } from './support-agent';
import { DomainAgent } from './domain-agent';
import { AgentFactory } from './agent.factory';

@Module({
  imports: [LlmModule, MemoryModule, RagModule],
  providers: [AssistantAgent, SupportAgent, DomainAgent, AgentFactory],
  exports: [AgentFactory, AssistantAgent, SupportAgent, DomainAgent],
})
export class AgentsModule {}

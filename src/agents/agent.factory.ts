import { Injectable, NotFoundException } from '@nestjs/common';
import { AssistantAgent } from './assistant-agent';
import { SupportAgent } from './support-agent';
import { DomainAgent } from './domain-agent';
import { IAgent } from './agent.interface';

@Injectable()
export class AgentFactory {
  private readonly agents: Map<string, IAgent>;

  constructor(
    assistant: AssistantAgent,
    support: SupportAgent,
    domain: DomainAgent,
  ) {
    this.agents = new Map<string, IAgent>([
      ['assistant', assistant],
      ['support', support],
      ['domain', domain],
    ]);
  }

  create(agentId: string): IAgent {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new NotFoundException(`Agent not found: ${agentId}`);
    }
    return agent;
  }

  list(): Array<{ id: string; name: string }> {
    return Array.from(this.agents.values()).map((a) => ({
      id: a.id,
      name: a.getConfig().name,
    }));
  }
}

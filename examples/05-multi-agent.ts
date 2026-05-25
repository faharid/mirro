import { createApp } from './run-example';
import { AgentFactory } from '../src/agents/agent.factory';

async function routeMessage(message: string): Promise<string> {
  const lower = message.toLowerCase();
  if (
    lower.includes('support') ||
    lower.includes('billing') ||
    lower.includes('help')
  ) {
    return 'support';
  }
  if (
    lower.includes('technical') ||
    lower.includes('api') ||
    lower.includes('architecture')
  ) {
    return 'domain';
  }
  return 'assistant';
}

async function main() {
  console.log('=== Multi-Agent System Example ===\n');

  const messages = [
    'I need help with my billing invoice',
    'Explain the API architecture for RAG',
    'What is the weather like today?',
  ];

  const app = await createApp();
  try {
    const factory = app.get(AgentFactory);

    for (const message of messages) {
      const agentId = await routeMessage(message);
      console.log(`Coordinator selected: ${agentId}`);
      const agent = factory.create(agentId);
      const response = await agent.handle(message, 'multi-agent-user');
      console.log(`Response: ${response}\n---\n`);
    }
  } finally {
    await app.close();
  }
}

main().catch(console.error);

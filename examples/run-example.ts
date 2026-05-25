import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AgentFactory } from '../src/agents/agent.factory';
import { TtsService } from '../src/voice/tts.service';
import { RagService } from '../src/rag/rag.service';

export async function createApp() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  return app;
}

export async function runAgentExample(
  agentId: string,
  message: string,
  userId = 'demo-user',
) {
  const app = await createApp();
  try {
    const factory = app.get(AgentFactory);
    const agent = factory.create(agentId);
    console.log(`\n[${agentId}] User: ${message}`);
    const response = await agent.handle(message, userId);
    console.log(`[${agentId}] Assistant: ${response}\n`);
    return response;
  } finally {
    await app.close();
  }
}

export { AgentFactory, TtsService, RagService };

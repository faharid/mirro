import { ConfigService } from '@nestjs/config';
import { LlmService } from '../llm/llm.service';
import { MemoryService } from '../memory/memory.service';
import { RagService } from '../rag/rag.service';
import { ContextManager } from '../memory/context-manager';
import { AgentConfig, IAgent } from './agent.interface';
import { ToolDefinition } from '../llm/types/tool';
import { ToolExecutor } from './tools/tool-executor';
import { ChatMessage } from '../llm/types/message';

export class DynamicAgent implements IAgent {
  constructor(
    readonly id: string,
    private readonly displayName: string,
    private readonly systemPrompt: string,
    private readonly tools: ToolDefinition[],
    private readonly provider: string | undefined,
    private readonly model: string | undefined,
    private readonly llmService: LlmService,
    private readonly memoryService: MemoryService,
    private readonly ragService: RagService,
    private readonly contextManager: ContextManager,
    private readonly toolExecutor: ToolExecutor,
    private readonly config: ConfigService,
    private readonly useRag = false,
  ) {}

  async handle(
    message: string,
    userId: string,
  ): Promise<{ text: string; shouldEscalate?: boolean }> {
    let ragContext = '';
    if (this.useRag) {
      try {
        const docs = await this.ragService.retrieve(message, { topK: 5 });
        ragContext = docs.map((d) => d.text).join('\n\n');
      } catch {
        // optional
      }
    }

    const memory = await this.memoryService.getUserMemory(userId);
    const memoryContext = [
      memory.summary ? `User summary: ${memory.summary.summary}` : '',
      memory.similar.length
        ? `Relevant past messages:\n${memory.similar.map((s) => `- ${s.content}`).join('\n')}`
        : '',
      ragContext ? `Relevant knowledge:\n${ragContext}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const history = await this.memoryService.getHistory(userId, {
      limit: 10,
      agentId: this.id,
    });

    const messages = this.contextManager.buildContext(
      history,
      this.systemPrompt,
      memoryContext,
    );
    messages.push({ role: 'user', content: message });

    const wantsJson = /\bjson\b/i.test(message);
    if (wantsJson) {
      messages[0].content +=
        '\n\nRespond with valid JSON only when structured output is requested.';
    }

    const response = await this.llmService.chat({
      messages,
      tools: this.tools.length ? this.tools : undefined,
      provider: (this.provider as 'openai') || this.config.get('llm.defaultProvider'),
      model: this.model || this.config.get('llm.defaultModel'),
      userId,
      skipCache: !!this.tools.length,
    });

    let finalText = response.text;

    if (response.toolCalls?.length) {
      const toolResults = await this.toolExecutor.executeAll(
        response.toolCalls,
        { userId, userMessage: message },
      );
      const followUp = await this.llmService.chat({
        messages: [
          ...messages,
          { role: 'assistant', content: response.text },
          {
            role: 'user',
            content: `Tool results:\n${toolResults.join('\n')}\nProvide final answer.`,
          },
        ],
        userId,
        skipCache: true,
      });
      finalText = followUp.text;
    }

    await this.memoryService.save({
      userId,
      userMessage: message,
      assistantResponse: finalText,
      timestamp: new Date(),
      agentId: this.id,
    });

    const shouldEscalate =
      this.id === 'support' &&
      /escalat|human|refund|legal|manager/i.test(message + finalText);

    return { text: finalText, shouldEscalate };
  }

  getConfig(): AgentConfig {
    return {
      id: this.id,
      name: this.displayName,
      provider: this.provider,
      model: this.model,
    };
  }
}

import { readFile } from 'fs/promises';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../llm/llm.service';
import { MemoryService } from '../memory/memory.service';
import { RagService } from '../rag/rag.service';
import { ContextManager } from '../memory/context-manager';
import { AgentConfig, IAgent } from './agent.interface';
import { ToolDefinition } from '../llm/types/tool';
import { executeCalculator } from './tools/calculator.tool';
import { executeWebSearch } from './tools/web-search.tool';

export const KNOWLEDGE_KEYWORDS = [
  'what', 'how', 'why', 'when', 'where', 'explain', 'documentation',
  'help', 'support', 'faq', 'price', 'cost', 'feature', 'api',
  'cuánto', 'cómo', 'qué', 'precio',
];

export abstract class BaseAgent implements IAgent {
  abstract readonly id: string;
  abstract readonly promptFile: string;
  abstract readonly tools: ToolDefinition[];
  protected useRagByDefault = true;

  constructor(
    protected readonly llmService: LlmService,
    protected readonly memoryService: MemoryService,
    protected readonly ragService: RagService,
    protected readonly contextManager: ContextManager,
    protected readonly config: ConfigService,
  ) {}

  async getSystemPrompt(): Promise<string> {
    const path = join(
      process.cwd(),
      'src/agents/system-prompts',
      this.promptFile,
    );
    return readFile(path, 'utf-8');
  }

  isKnowledgeQuestion(message: string): boolean {
    const lower = message.toLowerCase();
    return KNOWLEDGE_KEYWORDS.some((kw) => lower.includes(kw));
  }

  async handle(message: string, userId: string): Promise<string> {
    const memory = await this.memoryService.getUserMemory(userId);
    let ragContext = '';

    if (this.useRagByDefault && this.isKnowledgeQuestion(message)) {
      try {
        const docs = await this.ragService.retrieve(message, { topK: 5 });
        ragContext = docs.map((d) => d.text).join('\n\n');
      } catch {
        // RAG optional without embeddings
      }
    }

    const systemPrompt = await this.getSystemPrompt();
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
      systemPrompt,
      memoryContext,
    );
    messages.push({ role: 'user', content: message });

    const response = await this.llmService.chat({
      messages,
      tools: this.tools,
      provider: this.config.get('llm.defaultProvider'),
      model: this.config.get('llm.defaultModel'),
    });

    let finalText = response.text;

    if (response.toolCalls?.length) {
      const toolResults: string[] = [];
      for (const call of response.toolCalls) {
        if (call.name === 'calculate') {
          const expr = String(call.arguments.expression || '');
          const result = executeCalculator(expr);
          toolResults.push(`Calculator: ${JSON.stringify(result)}`);
        } else if (call.name === 'search') {
          const query = String(call.arguments.query || message);
          const results = await executeWebSearch(
            query,
            process.env.SERPAPI_KEY,
          );
          toolResults.push(`Search: ${JSON.stringify(results)}`);
        }
      }
      if (toolResults.length) {
        const followUp = await this.llmService.chat({
          messages: [
            ...messages,
            { role: 'assistant', content: response.text },
            {
              role: 'user',
              content: `Tool results:\n${toolResults.join('\n')}\nProvide final answer.`,
            },
          ],
        });
        finalText = followUp.text;
      }
    }

    await this.memoryService.save({
      userId,
      userMessage: message,
      assistantResponse: finalText,
      timestamp: new Date(),
      agentId: this.id,
    });

    return finalText;
  }

  getConfig(): AgentConfig {
    return {
      id: this.id,
      name: this.id,
      provider: this.config.get('llm.defaultProvider'),
      model: this.config.get('llm.defaultModel'),
    };
  }
}

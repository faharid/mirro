import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ToolCall } from '../../llm/types/tool';
import { MemoryService } from '../../memory/memory.service';
import { executeCalculator } from './calculator.tool';
import { executeWebSearch } from './web-search.tool';
import { executeHttpRequest } from './http.tool';
import { executeReadOnlyQuery } from './database.tool';

@Injectable()
export class ToolExecutor {
  constructor(
    private readonly memoryService: MemoryService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute(
    call: ToolCall,
    context: { userId: string; userMessage: string },
  ): Promise<string> {
    const args = call.arguments ?? {};

    switch (call.name) {
      case 'calculate': {
        const result = executeCalculator(String(args.expression ?? ''));
        return `Calculator: ${JSON.stringify(result)}`;
      }
      case 'search': {
        const query = String(args.query ?? context.userMessage);
        const results = await executeWebSearch(query, process.env.SERPAPI_KEY);
        return `Search: ${JSON.stringify(results)}`;
      }
      case 'http': {
        const result = await executeHttpRequest({
          url: String(args.url ?? ''),
          method: args.method as string | undefined,
          headers: args.headers as Record<string, string> | undefined,
          body: args.body,
        });
        return `HTTP: ${JSON.stringify(result)}`;
      }
      case 'database': {
        const result = await executeReadOnlyQuery(
          this.dataSource,
          String(args.table ?? 'conversations'),
          Number(args.limit ?? 10),
        );
        return `Database: ${JSON.stringify(result)}`;
      }
      case 'memory': {
        const similar = await this.memoryService.getSimilar(
          String(args.query ?? context.userMessage),
          { userId: context.userId, limit: Number(args.limit ?? 5) },
        );
        const history = await this.memoryService.getHistory(context.userId, {
          limit: Number(args.limit ?? 5),
        });
        return `Memory recall:\nSimilar: ${JSON.stringify(similar)}\nRecent: ${history.map((m) => `${m.role}: ${m.content}`).join('\n')}`;
      }
      default:
        return `Unknown tool: ${call.name}`;
    }
  }

  async executeAll(
    calls: ToolCall[],
    context: { userId: string; userMessage: string },
  ): Promise<string[]> {
    const results: string[] = [];
    for (const call of calls) {
      results.push(await this.execute(call, context));
    }
    return results;
  }
}

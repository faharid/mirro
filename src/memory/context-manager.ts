import { Injectable } from '@nestjs/common';
import { MessageEntity } from '../database/entities/message.entity';
import { ChatMessage } from '../llm/types/message';

@Injectable()
export class ContextManager {
  buildContext(
    messages: MessageEntity[],
    systemPrompt: string,
    extraContext?: string,
  ): ChatMessage[] {
    const sorted = [...messages].reverse();
    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: extraContext
          ? `${systemPrompt}\n\nAdditional context:\n${extraContext}`
          : systemPrompt,
      },
    ];

    for (const msg of sorted) {
      if (msg.role === 'system') continue;
      chatMessages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    return chatMessages;
  }

  trimHistory(messages: MessageEntity[], limit: number): MessageEntity[] {
    return messages.slice(0, limit);
  }
}

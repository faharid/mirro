import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ChatDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsString()
  agentId?: string = 'assistant';

  @IsOptional()
  @IsString()
  userId?: string = 'anonymous';

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

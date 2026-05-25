import { IsOptional, IsString, MinLength } from 'class-validator';

export class KnowledgeSearchDto {
  @IsString()
  @MinLength(1)
  q!: string;

  @IsOptional()
  topK?: number;
}

export class KnowledgeIngestDto {
  @IsOptional()
  @IsString()
  path?: string;
}

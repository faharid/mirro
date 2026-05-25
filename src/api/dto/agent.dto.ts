import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  type!: string;

  @IsString()
  systemPrompt!: string;

  @IsOptional()
  @IsArray()
  tools?: string[];

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsArray()
  tools?: string[];

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}

import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCloneDto {
  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateQuestionnaireDto {
  @IsObject()
  answers!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class InterviewMessageDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

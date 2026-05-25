import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SynthesizeDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsIn(['elevenlabs', 'deepgram', 'google'])
  provider?: 'elevenlabs' | 'deepgram' | 'google';

  @IsOptional()
  @IsString()
  voice?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TtsService } from '../voice/tts.service';
import { SttService } from '../voice/stt.service';
import { SynthesizeDto } from './dto/voice.dto';

@Controller('voice')
export class VoiceController {
  constructor(
    private readonly ttsService: TtsService,
    private readonly sttService: SttService,
  ) {}

  @Post('synthesize')
  async synthesize(@Body() dto: SynthesizeDto, @Res() res: Response) {
    const audio = await this.ttsService.synthesize({
      text: dto.text,
      provider: dto.provider,
      voiceId: dto.voice,
      language: dto.language,
    });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audio);
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'No audio file uploaded' };
    }
    const text = await this.sttService.transcribe(file.buffer, file.mimetype);
    return { text };
  }
}

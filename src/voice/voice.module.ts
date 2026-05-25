import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { SttService } from './stt.service';
import { ElevenLabsProvider } from './providers/elevenlabs.provider';
import { DeepgramTtsProvider } from './providers/deepgram.provider';
import { GoogleTtsProvider } from './providers/google-tts.provider';

@Module({
  providers: [
    TtsService,
    SttService,
    ElevenLabsProvider,
    DeepgramTtsProvider,
    GoogleTtsProvider,
  ],
  exports: [TtsService, SttService],
})
export class VoiceModule {}

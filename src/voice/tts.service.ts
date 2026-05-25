import { Injectable } from '@nestjs/common';
import { ElevenLabsProvider } from './providers/elevenlabs.provider';
import { DeepgramTtsProvider } from './providers/deepgram.provider';
import { GoogleTtsProvider } from './providers/google-tts.provider';

export type TtsProviderName = 'elevenlabs' | 'deepgram' | 'google';

@Injectable()
export class TtsService {
  constructor(
    private readonly elevenlabs: ElevenLabsProvider,
    private readonly deepgram: DeepgramTtsProvider,
    private readonly google: GoogleTtsProvider,
  ) {}

  async synthesize(options: {
    text: string;
    provider?: TtsProviderName;
    voiceId?: string;
    language?: string;
  }): Promise<Buffer> {
    const provider = options.provider || 'elevenlabs';

    switch (provider) {
      case 'elevenlabs':
        return this.elevenlabs.synthesize(options);
      case 'deepgram':
        return this.deepgram.synthesize(options);
      case 'google':
        return this.google.synthesize(options);
      default:
        throw new Error(`Unknown TTS provider: ${provider}`);
    }
  }
}

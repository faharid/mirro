import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElevenLabsProvider {
  constructor(private readonly config: ConfigService) {}

  async synthesize(options: {
    text: string;
    voiceId?: string;
    language?: string;
  }): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('ElevenLabs API key not configured');
    }

    const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: options.text,
          model_id: 'eleven_monolingual_v1',
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleTtsProvider {
  constructor(private readonly config: ConfigService) {}

  async synthesize(options: { text: string; language?: string }): Promise<Buffer> {
    const apiKey = this.config.get<string>('llm.googleApiKey') || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Google API key not configured');
    }

    const language = options.language || 'en-US';
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: options.text },
          voice: { languageCode: language, ssmlGender: 'NEUTRAL' },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Google TTS error: ${response.statusText}`);
    }

    const data = (await response.json()) as { audioContent: string };
    return Buffer.from(data.audioContent, 'base64');
  }
}

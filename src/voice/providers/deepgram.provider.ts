import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class DeepgramTtsProvider {
  async synthesize(options: {
    text: string;
    voiceId?: string;
  }): Promise<Buffer> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Deepgram API key not configured');
    }

    const response = await fetch(
      'https://api.deepgram.com/v1/speak?model=aura-asteria-en',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: options.text }),
      },
    );

    if (!response.ok) {
      throw new Error(`Deepgram TTS error: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

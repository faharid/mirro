import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class SttService {
  async transcribe(audioBuffer: Buffer, mimetype?: string): Promise<string> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Deepgram API key not configured for STT');
    }

    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': mimetype || 'audio/wav',
        },
        body: new Uint8Array(audioBuffer),
      },
    );

    if (!response.ok) {
      throw new Error(`Deepgram STT error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
    };

    return (
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
      ''
    );
  }
}

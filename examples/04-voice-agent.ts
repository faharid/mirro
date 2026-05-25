import { createApp, runAgentExample } from './run-example';
import { TtsService } from '../src/voice/tts.service';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  console.log('=== Voice Agent Example ===\n');

  const response = await runAgentExample(
    'assistant',
    'Say hello and introduce yourself in one sentence.',
  );

  const app = await createApp();
  try {
    const tts = app.get(TtsService);
    console.log('Synthesizing voice (requires ELEVENLABS_API_KEY)...');
    const audio = await tts.synthesize({
      text: response,
      provider: 'elevenlabs',
    });
    const outPath = join(process.cwd(), 'examples', 'output-voice.mp3');
    await writeFile(outPath, audio);
    console.log(`Audio saved to ${outPath}`);
  } catch (err) {
    console.log('Voice synthesis skipped:', (err as Error).message);
  } finally {
    await app.close();
  }
}

main().catch(console.error);

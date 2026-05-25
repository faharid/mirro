import { runAgentExample } from './run-example';

async function main() {
  console.log('=== Personal AI Assistant Example ===\n');
  await runAgentExample(
    'assistant',
    'Hello! What can you help me with today?',
  );
  await runAgentExample(
    'assistant',
    'Remember that I prefer concise answers.',
    'demo-user',
  );
}

main().catch(console.error);

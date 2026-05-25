import { runAgentExample } from './run-example';

async function main() {
  console.log('=== Tools Integration Example ===\n');
  await runAgentExample(
    'assistant',
    'Calculate 15% tip on a $84.50 restaurant bill',
  );
  await runAgentExample(
    'assistant',
    'Search for latest news about AI agents',
  );
}

main().catch(console.error);

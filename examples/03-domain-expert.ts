import { runAgentExample } from './run-example';

async function main() {
  console.log('=== Domain Expert Example ===\n');
  await runAgentExample(
    'domain',
    'Explain the RAG architecture and cite your sources.',
  );
}

main().catch(console.error);

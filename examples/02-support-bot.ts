import { runAgentExample } from './run-example';

async function main() {
  console.log('=== Customer Support Bot Example ===\n');
  await runAgentExample(
    'support',
    'What LLM providers does AI Clone Kit support?',
  );
  await runAgentExample(
    'support',
    'How do I add documents to the knowledge base?',
  );
}

main().catch(console.error);

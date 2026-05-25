import { KNOWLEDGE_KEYWORDS } from '../src/agents/base-agent';

describe('Agents module', () => {
  it('should detect knowledge questions', () => {
    const isKnowledge = (msg: string) =>
      KNOWLEDGE_KEYWORDS.some((kw) => msg.toLowerCase().includes(kw));

    expect(isKnowledge('How does RAG work?')).toBe(true);
    expect(isKnowledge('Hello there')).toBe(false);
  });

  it('knowledge keywords should include support terms', () => {
    expect(KNOWLEDGE_KEYWORDS).toContain('support');
    expect(KNOWLEDGE_KEYWORDS).toContain('faq');
  });
});

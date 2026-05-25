import { getQuestionnaireTemplate } from '../src/clones/questionnaire.schema';
import { parseMirrorCard } from '../src/clones/mirror-card.types';

describe('Clones / mirror card', () => {
  it('questionnaire template has sections', () => {
    const template = getQuestionnaireTemplate();
    expect(template).toBeDefined();
    expect(Object.keys(template).length).toBeGreaterThan(0);
  });

  it('parseMirrorCard validates minimal structure', () => {
    const card = parseMirrorCard({
      identity: {
        name: 'Alex',
        archetype: 'Mentor',
        oneLineBio: 'Builder and teacher',
      },
      personality: {
        traits: ['curious'],
        values: ['honesty'],
        communicationStyle: 'warm',
        humor: 'dry',
        boundaries: ['no politics'],
      },
      speechPatterns: {
        vocabulary: ['ship it'],
        sentenceStyle: 'short',
        samplePhrases: ['Let us go'],
      },
      knowledge: {
        expertise: ['software'],
        opinions: ['tests matter'],
      },
      interviewHighlights: ['loves teaching'],
      systemPrompt: 'You are Alex.',
    });
    expect(card).not.toBeNull();
    expect(card!.identity.name).toBe('Alex');
    expect(card!.systemPrompt).toContain('Alex');
  });

  it('parseMirrorCard returns null on invalid shape', () => {
    expect(parseMirrorCard({ foo: 'bar' })).toBeNull();
  });
});

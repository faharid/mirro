export const QUESTIONNAIRE_SECTIONS = [
  {
    id: 'identity',
    title: 'Identity',
    questions: [
      { id: 'fullName', label: 'Full name or persona name', type: 'text' },
      { id: 'role', label: 'Professional role / title', type: 'text' },
      { id: 'oneLineBio', label: 'One-line bio', type: 'text' },
    ],
  },
  {
    id: 'personality',
    title: 'Personality',
    questions: [
      { id: 'traits', label: 'Key personality traits (comma-separated)', type: 'text' },
      { id: 'values', label: 'Core values', type: 'textarea' },
      { id: 'humor', label: 'Sense of humor style', type: 'text' },
      { id: 'boundaries', label: 'Topics to avoid / boundaries', type: 'textarea' },
    ],
  },
  {
    id: 'communication',
    title: 'Communication style',
    questions: [
      { id: 'tone', label: 'Typical tone (formal, casual, witty...)', type: 'text' },
      { id: 'vocabulary', label: 'Favorite words or phrases', type: 'textarea' },
      { id: 'sentenceStyle', label: 'Short or long sentences?', type: 'text' },
      { id: 'samplePhrases', label: '3 phrases they often say', type: 'textarea' },
    ],
  },
  {
    id: 'expertise',
    title: 'Knowledge & opinions',
    questions: [
      { id: 'expertise', label: 'Areas of expertise', type: 'textarea' },
      { id: 'opinions', label: 'Strong opinions on topics', type: 'textarea' },
    ],
  },
] as const;

export function getQuestionnaireTemplate(): Record<string, string> {
  const template: Record<string, string> = {};
  for (const section of QUESTIONNAIRE_SECTIONS) {
    for (const q of section.questions) {
      template[q.id] = '';
    }
  }
  return template;
}

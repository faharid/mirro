import { readFile } from 'fs/promises';
import { basename } from 'path';

export interface LoadedDocument {
  text: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export async function loadMarkdown(filePath: string): Promise<LoadedDocument> {
  const text = await readFile(filePath, 'utf-8');
  return {
    text,
    source: basename(filePath),
    metadata: { type: 'markdown' },
  };
}

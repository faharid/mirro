import { readFile } from 'fs/promises';
import { basename } from 'path';
import pdfParse from 'pdf-parse';
import { LoadedDocument } from './markdown.loader';

export async function loadPdf(filePath: string): Promise<LoadedDocument> {
  const buffer = await readFile(filePath);
  const parsed = await pdfParse(buffer);
  return {
    text: parsed.text,
    source: basename(filePath),
    metadata: { type: 'pdf', pages: parsed.numpages },
  };
}

import * as cheerio from 'cheerio';
import { LoadedDocument } from './markdown.loader';

export async function loadWeb(url: string): Promise<LoadedDocument> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return {
    text,
    source: url,
    metadata: { type: 'web' },
  };
}

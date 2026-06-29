import { Injectable } from '@nestjs/common';
import { Document } from 'llamaindex';
import LlamaCloud from '@llamaindex/llama-cloud';
import * as fs from 'fs';
import { EXTRACTING_PROMPT } from './extracting.prompt';

type MarkdownResultPage = {
  markdown: string;
  page_number: number;
  success: true;
  footer?: string | null;
  header?: string | null;
};

type FailedMarkdownPage = {
  error: string;
  page_number: number;
  success: false;
};

type MarkdownPage = MarkdownResultPage | FailedMarkdownPage;

@Injectable()
export class ExtractingService {
  private readonly client: LlamaCloud;

  constructor() {
    this.client = new LlamaCloud();
  }

  private cleanRedundancy(text: string) {
    const frequent = this.detectFrequentLines(text);

    const cleaned = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => {
        if (!l) return false;

        if (/^\d+$/.test(l)) return false;

        if (/^(page|página|pag|pág)\.?\s*\d+$/i.test(l)) return false;

        if (frequent.has(l)) return false;

        return true;
      })
      .join('\n');

    return cleaned.replace(/\n{3,}/g, '\n\n');
  }

  private detectFrequentLines(text: string) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const freq = new Map<string, number>();

    for (const line of lines) {
      freq.set(line, (freq.get(line) || 0) + 1);
    }

    const threshold = Math.ceil(lines.length * 0.05);

    return new Set(
      [...freq.entries()]
        .filter(([_, count]) => count >= threshold)
        .map(([line]) => line),
    );
  }

  public async extractText(filePath: string): Promise<Document[]> {
    const file = await this.client.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'parse',
    });
    try {
      const result = await this.client.parsing.parse({
        file_id: file.id,
        tier: 'cost_effective',
        version: 'latest',
        expand: ['markdown'],
        crop_box: {
          top: 0.15,
          bottom: 0.15,
          left: 0,
          right: 0,
        },
        agentic_options: {
          custom_prompt: EXTRACTING_PROMPT,
        },
        output_options: {
          markdown: {
            tables: {
              merge_continued_tables: true,
              output_tables_as_markdown: true,
            },
          },
        },
      });

      if (!result.markdown) {
        return [];
      }

      const fullMarkdown = result.markdown.pages
        .filter((p: MarkdownPage): p is MarkdownResultPage => p.success)
        .map((p) => p.markdown)
        .join('\n\n');

      const cleanMarkdown = this.cleanRedundancy(fullMarkdown);

      return [
        new Document({
          text: cleanMarkdown,
        }),
      ];
    } finally {
      try {
        await this.client.files.delete(file.id);
        console.log(`✅ Archivo temporal ${file.id} eliminado de la nube.`);
      } catch (cleanupError) {
        console.error(
          `⚠️ No se pudo eliminar el archivo temporal ${file.id}:`,
          cleanupError,
        );
      }
    }
  }
}

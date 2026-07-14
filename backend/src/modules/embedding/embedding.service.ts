import { Injectable } from '@nestjs/common';
import { TextNode, MetadataMode } from 'llamaindex';
import { OpenAIEmbedding } from '@llamaindex/openai';

@Injectable()
export class EmbeddingService {
  private embedModel: OpenAIEmbedding;

  constructor() {
    this.embedModel = new OpenAIEmbedding({ model: 'text-embedding-3-small' });
  }

  public async generateEmbeddingsForNodes(
    nodes: TextNode[],
  ): Promise<TextNode[]> {
    const texts = nodes.map((node) => node.getContent(MetadataMode.NONE));

    const embeddings = await this.embedModel.getTextEmbeddings(texts);

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].embedding = embeddings[i];
    }

    return nodes;
  }

  public async generateQueryEmbedding(query: string): Promise<number[]> {
    const embedding = await this.embedModel.getQueryEmbedding({
      type: 'text',
      text: query,
    });

    if (!embedding) {
      throw new Error(
        'No se pudo generar el embedding para la consulta del usuario.',
      );
    }

    return embedding;
  }
}

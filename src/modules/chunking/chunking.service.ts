/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  TextNode,
  Document,
  SentenceSplitter,
  NodeRelationship,
} from 'llamaindex';
import { DocumentChunk } from 'src/database/entities/document-chunk.entity';
import { EntityManager, Repository } from 'typeorm';
import { ParentDocumentsService } from '../parent-documents/parent-documents.service';
import { ParentDocument } from 'src/database/entities/parent-document.entity';

@Injectable()
export class ChunkingService {
  constructor(
    @InjectRepository(DocumentChunk)
    private readonly chunkRepo: Repository<DocumentChunk>,
    private readonly parentService: ParentDocumentsService,
  ) {}

  private readonly MAX_THRESHOLD = 0.85;
  private readonly DYNAMIC_MARGIN = 0.08;
  private readonly MAX_PARENT_DOCUMENTS = 3;

  public processAndStoreHierarchicalNodes(documents: Document[]) {
    const parentSplitter = new SentenceSplitter({
      chunkSize: 600,
      chunkOverlap: 60,
    });
    const childSplitter = new SentenceSplitter({
      chunkSize: 150,
      chunkOverlap: 30,
    });

    const allChildNodes: TextNode[] = [];
    const allParentNodes: TextNode[] = [];

    for (const doc of documents) {
      const parentNodes = parentSplitter.getNodesFromDocuments([doc]);
      const childNodes = childSplitter.getNodesFromDocuments([doc]);

      allParentNodes.push(...parentNodes);

      let parentIdx = 0;

      for (const child of childNodes) {
        const childStart = child.startCharIdx ?? 0;
        const childEnd = child.endCharIdx ?? 0;
        const childMiddle = childStart + (childEnd - childStart) / 2;

        while (
          parentIdx < parentNodes.length - 1 &&
          childMiddle > (parentNodes[parentIdx].endCharIdx ?? 0)
        ) {
          parentIdx++;
        }

        const parent = parentNodes[parentIdx];

        child.relationships[NodeRelationship.PARENT] = {
          nodeId: parent.id_,
          metadata: parent.metadata ?? {},
        };

        child.metadata = {
          ...(doc.metadata ?? {}),
          ...parent.metadata,
          parent_id: parent.id_,
        };

        allChildNodes.push(child);
      }
    }

    return {
      childNodes: allChildNodes,
      parentNodes: allParentNodes,
    };
  }

  public async saveChunks(
    nodes: TextNode[],
    documentId: string,
    userId: string,
    manager?: EntityManager,
    embeddingModel: string = 'text-embedding-3-small',
  ) {
    const repo = manager
      ? manager.getRepository(DocumentChunk)
      : this.chunkRepo;

    const chunksToInsert = nodes.map((node, index) =>
      this.toDocumentChunk(node, index, documentId, userId, embeddingModel),
    );

    await repo.save(chunksToInsert);
  }

  public async retrieveParentContext(
    query: string,
    documentIds: string[],
    userId: string,
    limit: number,
  ): Promise<ParentDocument[]> {
    const queryBuilder = this.chunkRepo
      .createQueryBuilder('chunk')
      .select([
        'chunk.id',
        'chunk.parentId',
        'chunk.content',
        'chunk.chunkIndex',
      ])
      .where('chunk.user_id = :userId', { userId })
      .andWhere('chunk.embedding <=> :queryEmbedding::vector < :threshold', {
        threshold: this.MAX_THRESHOLD,
      })
      .addSelect('chunk.embedding <=> :queryEmbedding::vector', 'distance')
      .orderBy('distance', 'ASC')
      .setParameter('queryEmbedding', query)
      .limit(limit);

    if (documentIds && documentIds.length > 0) {
      queryBuilder.andWhere('chunk.document_id IN (:...documentIds)', {
        documentIds,
      });
    }

    const childChunks = await queryBuilder.getRawAndEntities();

    const bestDistance = Number(childChunks.raw[0].distance);

    const dynamicThreshold = Math.min(
      bestDistance + this.DYNAMIC_MARGIN,
      this.MAX_THRESHOLD,
    );

    const parentIdsToFetch = new Set<string>();

    childChunks.raw.forEach((row, index) => {
      const currentDistance = Number(row.distance);
      const isIncluded = currentDistance <= dynamicThreshold;
      console.log({
        id: childChunks.entities[index].id,
        distance: currentDistance,
        status: isIncluded ? '✅ PASÓ' : '❌ FILTRADO',
      });

      if (isIncluded) {
        parentIdsToFetch.add(childChunks.entities[index].parentId);
      }
    });

    const parentIdsArray = Array.from(parentIdsToFetch).slice(
      0,
      this.MAX_PARENT_DOCUMENTS,
    );
    const parentDocuments =
      await this.parentService.getParentDocuments(parentIdsArray);

    return parentDocuments;
  }

  private toDocumentChunk(
    node: TextNode,
    index: number,
    documentId: string,
    userId: string,
    embeddingModel: string = 'text-embedding-3-small',
  ): DocumentChunk {
    return this.chunkRepo.create({
      documentId,
      userId,
      content: node.text,
      chunkIndex: index,
      embeddingModel: embeddingModel,
      embedding: node.embedding,
      parentId: node.metadata.parent_id as string,
    });
  }
}

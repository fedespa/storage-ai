import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TextNode } from 'llamaindex';
import { ParentDocument } from 'src/database/entities/parent-document.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class ParentDocumentsService {
  constructor(
    @InjectRepository(ParentDocument)
    private readonly parentRepository: Repository<ParentDocument>,
  ) {}

  public async getParentDocuments(ids: string[]) {
    if (!ids.length) return [];
    return await this.parentRepository.findBy({ id: In(ids) });
  }

  public async saveParentDocuments(nodes: TextNode[]) {
    const documentsToInsert: ParentDocument[] = nodes.map((n) =>
      this.toParentDocument(n),
    );

    await this.parentRepository.save(documentsToInsert);
  }

  private toParentDocument(node: TextNode): ParentDocument {
    return this.parentRepository.create({
      id: node.id_,
      content: node.text,
    });
  }
}

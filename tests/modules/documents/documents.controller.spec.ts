import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DocumentsController } from 'src/modules/documents/documents.controller';
import { DocumentListQueryDto } from 'src/modules/documents/dto/document-list-query.dto';
import { DocumentsService } from 'src/modules/documents/documents.service';
import {
  Document,
  DocumentStatus,
} from 'src/database/entities/document.entity';
import type { RequestWithUser } from 'src/common/request-with-user.interface';

const USER_ID = 'ebd52138-d073-4d64-8447-6657e527cf9f';

describe('DocumentsController', () => {
  const listByUser = jest.fn();
  const documentsService = {
    listByUser,
  } as unknown as DocumentsService;
  const controller = new DocumentsController(documentsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated document list items without storage or ownership data', async () => {
    const document = createDocument();
    listByUser.mockResolvedValue([[document], 1]);
    const query = plainToInstance(DocumentListQueryDto, {
      page: 1,
      limit: 20,
    });

    const result = await controller.listDocuments(
      { user: { userId: USER_ID } } as RequestWithUser,
      query,
    );

    expect(listByUser).toHaveBeenCalledWith(USER_ID, query);
    expect(result).toEqual({
      data: [
        {
          id: document.id,
          name: document.name,
          extension: document.extension,
          mimeType: document.mimeType,
          size: document.size,
          status: DocumentStatus.PROCESSED,
          createdAt: document.createdAt,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('returns an empty page when it is beyond the available results', async () => {
    listByUser.mockResolvedValue([[], 21]);
    const query = plainToInstance(DocumentListQueryDto, {
      page: 3,
      limit: 20,
    });

    const result = await controller.listDocuments(
      { user: { userId: USER_ID } } as RequestWithUser,
      query,
    );

    expect(result).toEqual({
      data: [],
      page: 3,
      limit: 20,
      total: 21,
      totalPages: 2,
    });
  });
});

describe('DocumentListQueryDto', () => {
  it('trims a search value and accepts it within the document-name limit', async () => {
    const query = plainToInstance(DocumentListQueryDto, {
      search: '  Informe Q1  ',
    });

    const errors = await validate(query);

    expect(errors).toHaveLength(0);
    expect(query.search).toBe('Informe Q1');
  });

  it('rejects a search value longer than 255 characters', async () => {
    const query = plainToInstance(DocumentListQueryDto, {
      search: 'a'.repeat(256),
    });

    const errors = await validate(query);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('search');
  });
});

function createDocument(): Document {
  return {
    id: '6cb592c7-256c-41dc-bab2-c368d7e44ca4',
    userId: USER_ID,
    size: 42,
    name: 'Informe Q1.pdf',
    extension: 'pdf',
    mimeType: 'application/pdf',
    status: DocumentStatus.PROCESSED,
    key: 'private-key',
    createdAt: new Date('2026-07-10T12:00:00.000Z'),
    updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    deletedAt: null,
  } as Document;
}

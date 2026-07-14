import { FindManyOptions, ILike, Repository } from 'typeorm';
import { Document } from 'src/database/entities/document.entity';
import { DocumentsService } from 'src/modules/documents/documents.service';
import { DocumentListQueryDto } from 'src/modules/documents/dto/document-list-query.dto';

const USER_ID = 'ebd52138-d073-4d64-8447-6657e527cf9f';

describe('DocumentsService.listByUser', () => {
  let receivedOptions: FindManyOptions<Document> | undefined;
  const documentRepository = {
    findAndCount: (options: FindManyOptions<Document>) => {
      receivedOptions = options;
      return Promise.resolve([[], 0] as [Document[], number]);
    },
  } as unknown as Repository<Document>;
  const eventBus = { publish: jest.fn() };
  const service = new DocumentsService(documentRepository, eventBus);

  beforeEach(() => {
    receivedOptions = undefined;
  });

  it('filters by the user and non-deleted documents, escapes literal search characters, and paginates', async () => {
    const query: DocumentListQueryDto = {
      page: 2,
      limit: 10,
      search: '  100%_\\  ',
    };
    await service.listByUser(USER_ID, query);

    expect(receivedOptions).toBeDefined();
    if (!receivedOptions) {
      throw new Error('Expected a document query');
    }
    const where = receivedOptions.where;

    expect(where).toBeDefined();
    expect(Array.isArray(where)).toBe(false);
    if (!where || Array.isArray(where)) {
      throw new Error('Expected a single document filter');
    }

    expect(where.userId).toBe(USER_ID);
    expect(where.deletedAt).toBeDefined();
    expect(where.name).toEqual(ILike('%100\\%\\_\\\\%'));
    expect(receivedOptions.order).toEqual({ createdAt: 'DESC', id: 'DESC' });
    expect(receivedOptions.skip).toBe(10);
    expect(receivedOptions.take).toBe(10);
  });

  it('does not filter by name when search is blank', async () => {
    const query: DocumentListQueryDto = {
      page: 1,
      limit: 20,
      search: '   ',
    };
    await service.listByUser(USER_ID, query);

    expect(receivedOptions).toBeDefined();
    if (!receivedOptions) {
      throw new Error('Expected a document query');
    }
    const where = receivedOptions.where;

    expect(where).toBeDefined();
    expect(Array.isArray(where)).toBe(false);
    if (!where || Array.isArray(where)) {
      throw new Error('Expected a single document filter');
    }

    expect(where.name).toBeUndefined();
  });
});

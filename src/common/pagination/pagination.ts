import { PaginatedResponseDto } from '../../modules/chats/dto/paginated-response.dto';

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function buildPaginatedResponse<TData>(
  data: TData,
  total: number,
  page: number,
  limit: number,
): PaginatedResponseDto<TData> {
  return {
    data,
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

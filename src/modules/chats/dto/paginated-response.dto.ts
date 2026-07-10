export class PaginatedResponseDto<TData> {
  data!: TData;
  page!: number;
  limit!: number;
  total!: number;
  totalPages!: number;
}

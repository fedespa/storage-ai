import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/modules/chats/dto/pagination-query.dto';

export class DocumentListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'search debe ser una cadena de texto' })
  @MaxLength(255, {
    message: 'search debe tener como maximo 255 caracteres',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;
}

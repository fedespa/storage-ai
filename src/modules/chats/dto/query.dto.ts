import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryDto {
  @IsString({ message: 'La query debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La query es obligatoria y no puede estar vacía' })
  @MaxLength(1000, {
    message: 'La query es demasiado larga (máximo 1000 caracteres)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  query!: string;
}

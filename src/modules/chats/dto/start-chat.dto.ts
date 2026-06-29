import {
  IsArray,
  IsUUID,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class StartChatDto {
  @IsOptional()
  @IsArray({ message: 'documentIds debe ser un arreglo' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de documento debe ser un UUID v4 válido',
  })
  documentIds!: string[];

  @IsString({ message: 'La query debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La query es obligatoria y no puede estar vacía' })
  @MaxLength(1000, {
    message: 'La query es demasiado larga (máximo 1000 caracteres)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  query!: string;
}

/* eslint-disable no-useless-escape */
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UploadDto {
  @IsString({ message: 'El tipo de archivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo de archivo es obligatorio.' })
  type!: string;

  @IsNumber({}, { message: 'El tamaño debe ser un número.' })
  @Min(1, { message: 'El archivo no puede estar vacío.' })
  @Max(104857600, {
    message: 'El archivo supera el límite máximo permitido de 100 MB.',
  })
  size!: number;

  @IsString({ message: 'El tipo de archivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del archivo es obligatorio.' })
  @Matches(/^[^\\/:\*\?"<>\|]+$/, {
    message: 'El nombre del archivo contiene caracteres no permitidos.',
  })
  name!: string;
}

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'El token debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El token es obligatorio y no puede estar vacío.' })
  token!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria y no puede estar vacía.',
  })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  newPassword!: string;
}

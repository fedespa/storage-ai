import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Por favor, ingresa un correo electrónico válido.' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria y no puede estar vacía.',
  })
  password!: string;
}

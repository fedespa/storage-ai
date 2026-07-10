import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Por favor, ingresa un correo electrónico válido.' })
  email!: string;
}

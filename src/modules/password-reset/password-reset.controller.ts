import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @HttpCode(HttpStatus.OK)
  @Post('request')
  request(@Body() body: RequestPasswordResetDto): Promise<{ message: string }> {
    return this.passwordResetService.requestPasswordReset(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('confirm')
  async confirm(@Body() body: ResetPasswordDto): Promise<{ message: string }> {
    await this.passwordResetService.resetPassword(body.token, body.newPassword);

    return {
      message: 'La contraseña fue restablecida exitosamente.',
    };
  }
}

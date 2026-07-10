import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { ConfigType } from '@nestjs/config';
import mailConfig from 'src/config/mail.config';
import { PasswordResetToken } from 'src/database/entities/password-reset-token.entity';
import { MailService } from 'src/common/mail/mail.service';
import { UserService } from '../users/users.service';

export interface RequestResetResult {
  message: string;
}

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    @Inject(mailConfig.KEY)
    private readonly mailSettings: ConfigType<typeof mailConfig>,
  ) {}

  async requestPasswordReset(email: string): Promise<RequestResetResult> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return {
        message:
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      };
    }

    const { token, tokenHash } = this.generateToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.passwordResetTokenRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
        isUsed: false,
      }),
    );

    const resetUrl = `${this.mailSettings.frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    await this.mailService.send({
      to: user.email,
      subject: 'Restablecer contraseña',
      text: `Para restablecer tu contraseña, abre este enlace: ${resetUrl}`,
      html: this.buildResetEmailHtml(resetUrl),
    });

    return {
      message:
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    await this.dataSource.transaction(async (manager) => {
      const storedToken = await this.findByTokenHash(tokenHash, manager);

      if (!storedToken || !storedToken.isUsable()) {
        throw new UnauthorizedException('Token de restablecimiento inválido');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.userService.updatePasswordHash(
        storedToken.userId,
        hashedPassword,
        manager,
      );

      await this.markTokenAsUsed(storedToken.tokenHash, manager);
    });
  }

  private async findByTokenHash(
    tokenHash: string,
    manager?: EntityManager,
  ): Promise<PasswordResetToken | null> {
    const repo = manager
      ? manager.getRepository(PasswordResetToken)
      : this.passwordResetTokenRepository;

    const queryBuilder = repo
      .createQueryBuilder('passwordResetToken')
      .innerJoinAndSelect('passwordResetToken.user', 'user')
      .where('passwordResetToken.tokenHash = :tokenHash', { tokenHash });

    if (manager) {
      queryBuilder.setLock('pessimistic_write');
    }

    return await queryBuilder.getOne();
  }

  private async markTokenAsUsed(
    tokenHash: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(PasswordResetToken)
      : this.passwordResetTokenRepository;

    await repo.update({ tokenHash }, { isUsed: true });
  }

  private generateToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString('hex');

    return {
      token,
      tokenHash: this.hashToken(token),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private buildResetEmailHtml(resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${resetUrl}" target="_blank" rel="noreferrer">Restablecer contraseña</a></p>
        <p>Este enlace expira en 30 minutos.</p>
      </div>
    `;
  }
}

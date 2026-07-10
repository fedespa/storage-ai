import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetToken } from 'src/database/entities/password-reset-token.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from 'src/common/mail/mail.module';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordResetToken]),
    UsersModule,
    MailModule,
  ],
  providers: [PasswordResetService],
  controllers: [PasswordResetController],
})
export class PasswordResetModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { ConfigModule } from '@nestjs/config';
import jwtConfig, { type JwtConfig } from 'src/config/jwt.config';
import { StringValue } from 'ms';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [jwtConfig.KEY],
      useFactory: (jwtConfig: JwtConfig) => ({
        secret: jwtConfig.secret,
        signOptions: {
          expiresIn: jwtConfig.expiresIn as StringValue,
        },
      }),
    }),
    UsersModule,
    RefreshTokensModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

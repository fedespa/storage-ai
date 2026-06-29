/* eslint-disable @typescript-eslint/no-misused-promises */
import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import databaseConfig from './config/database.config';
import awsConfig from './config/aws.config';
import jwtConfig from './config/jwt.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusModule } from './common/event-bus/event-bus.module';
import { ProcessingModule } from './modules/processing/processing.module';
import { ChatsModule } from './modules/chats/chats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, awsConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
      }),
    }),
    EventEmitterModule.forRoot(),
    EventBusModule,
    UsersModule,
    AuthModule,
    UploadModule,
    ProcessingModule,
    ChatsModule,
  ],
})
export class AppModule {}

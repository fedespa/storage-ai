import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenUsage } from '../../database/entities/token-usage.entity';
import { TokenUsageService } from './token-usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenUsage])],
  providers: [TokenUsageService],
  exports: [TokenUsageService],
})
export class UsageModule {}

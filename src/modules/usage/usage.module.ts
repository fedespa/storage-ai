import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../../database/entities/document.entity';
import { TokenUsage } from '../../database/entities/token-usage.entity';
import { TokenUsageService } from './token-usage.service';
import { UsageMetricsService } from './usage-metrics.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenUsage, Document])],
  providers: [TokenUsageService, UsageMetricsService],
  exports: [TokenUsageService, UsageMetricsService],
})
export class UsageModule {}

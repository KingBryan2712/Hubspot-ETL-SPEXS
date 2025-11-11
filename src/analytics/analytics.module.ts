import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { HubspotLead } from '../database/HubspotLead.entity';
import { HubspotDeal } from '../database/HubspotDeal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HubspotLead, HubspotDeal]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService], 
})
export class AnalyticsModule {}
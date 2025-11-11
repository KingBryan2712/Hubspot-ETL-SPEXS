import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EtlService } from './etl.service';
import { HubspotService } from './hubspot.service';

import { HubspotLead } from '../database/HubspotLead.entity';
import { HubspotDeal } from '../database/HubspotDeal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HubspotLead, HubspotDeal]),
  ],
  controllers: [], 
  providers: [EtlService, HubspotService], 
  exports: [EtlService], 
})
export class EtlModule {}
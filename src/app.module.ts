import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EtlModule } from './etl/etl.module';
import { HubspotLead } from './database/HubspotLead.entity';
import { HubspotDeal } from './database/HubspotDeal.entity';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // 1. Cargar variables de entorno (simulación de .env)
    ConfigModule.forRoot({ isGlobal: true }), 
    
    // 2. Configuración del Módulo de Base de Datos (PostgreSQL)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10), 
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'spexs_secret',
      database: process.env.DB_DATABASE || 'spexs_dwh',
      
      // Entidades a mapear:
      entities: [HubspotLead, HubspotDeal],
      
      synchronize: true, 
    }),
    
    // 3. Módulos de la Aplicación
    EtlModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
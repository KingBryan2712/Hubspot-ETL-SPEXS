import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EtlService } from './etl/etl.service'; 
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], 
  });

  // 1. Ejecutar el Proceso ETL (Job) al iniciar la aplicación
  logger.log('Iniciando: Ejecución del Proceso ETL...');
  try {
    const etlService = app.get(EtlService);
    await etlService.runETL();
    logger.log('ETL finalizado. Los datos están en PostgreSQL.');
  } catch (error) {
    logger.error('Fallo crítico al ejecutar el ETL:', error);
  }
  
  // 2. Iniciar el servidor API para exponer las consultas analíticas
  await app.listen(3000);
  logger.log(`\n🚀 Servidor API (para analítica) corriendo en: ${await app.getUrl()}`);
  logger.log('Endpoints disponibles: /analytics/conversion y /analytics/deals-performance');
}

bootstrap().catch(err => {
  logger.error('Error al iniciar la aplicación:', err);
  process.exit(1);
});
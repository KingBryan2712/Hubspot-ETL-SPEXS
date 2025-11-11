import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { HubspotService } from './hubspot.service';
import { HubspotLead } from '../database/HubspotLead.entity';
import { HubspotDeal } from '../database/HubspotDeal.entity';

@Injectable()
export class EtlService {
    private readonly logger = new Logger(EtlService.name);
    
    // Umbral de valor alto para la transformación de Deals
    private readonly HIGH_VALUE_THRESHOLD = 10000; 

    constructor(
        private readonly hubspotService: HubspotService,
        @InjectRepository(HubspotLead)
        private leadsRepository: Repository<HubspotLead>,
        @InjectRepository(HubspotDeal)
        private dealsRepository: Repository<HubspotDeal>,
    ) {}

    // --- Transformación (T) ---

    /**
     * T: Aplica transformaciones a un registro de Lead crudo.
     * @param rawLead Objeto crudo de la API de HubSpot.
     * @returns Objeto de entidad limpio y mapeado.
     */
    private transformLead(rawLead: any): HubspotLead {
        const props = rawLead.properties;
        const now = new Date();

        const transformedLead = new HubspotLead();
        transformedLead.hubspot_id = rawLead.id.toString();
        transformedLead.email = props.email || 'N/A';
        
        // Transformación 1: Concatenación de nombre completo
        transformedLead.full_name = `${props.firstname || ''} ${props.lastname || ''}`.trim(); 
        
        transformedLead.life_cycle_stage = props.lifecyclestage || 'unknown';
        transformedLead.created_at = new Date(props.createdate);
        transformedLead.updated_at_hubspot = new Date(props.hs_lastmodifieddate);
        transformedLead.last_etl_run = now; 
        
        return transformedLead;
    }

    /**
     * T: Aplica transformaciones a un registro de Deal crudo.
     * @param rawDeal Objeto crudo de la API de HubSpot.
     * @returns Objeto de entidad limpio y mapeado.
     */
    private transformDeal(rawDeal: any): HubspotDeal {
        const props = rawDeal.properties;
        const now = new Date();
        
        const transformedDeal = new HubspotDeal();
        transformedDeal.hubspot_id = rawDeal.id.toString();
        transformedDeal.name = props.dealname || 'Untitled Deal';
        
        // Transformación 1: Conversión de monto y manejo de nulos (data type consistency)
        transformedDeal.amount_usd = props.amount ? parseFloat(props.amount) : 0.00; 

        // Transformación 2: Ingeniería de Features - Bandera de alto valor
        transformedDeal.is_high_value = transformedDeal.amount_usd >= this.HIGH_VALUE_THRESHOLD;

        transformedDeal.stage = props.dealstage || 'unknown';
        transformedDeal.close_date = props.closedate ? new Date(props.closedate) : null;
        transformedDeal.created_at = new Date(props.createdate);
        transformedDeal.updated_at_hubspot = new Date(props.hs_lastmodifieddate);
        transformedDeal.last_etl_run = now; 

        return transformedDeal;
    }

    // --- Carga (L) ---
    
    /**
     * L: Ejecuta la carga de datos en lotes, utilizando la función upsert de TypeORM.
     * Este enfoque se traduce internamente en la cláusula ON CONFLICT DO UPDATE de PostgreSQL,
     * garantizando un rendimiento superior a INSERT o UPDATE por separado y asegurando la IDEMPOTENCIA.
     * @param repository Repositorio de TypeORM (Leads o Deals).
     * @param entities Array de entidades transformadas.
     * @param conflictPath Columna PK para el conflicto (siempre 'hubspot_id').
     */
    private async upsertBatch<T extends ObjectLiteral>( 
        repository: Repository<T>, 
        entities: T[], 
        conflictPath: keyof T
    ): Promise<void> {
        if (entities.length === 0) {
            this.logger.warn(`No hay datos para cargar en ${repository.metadata.tableName}.`);
            return;
        }

        try {
            await repository.upsert(entities, {
                conflictPaths: [conflictPath as string], 
                skipUpdateIfNoValuesChanged: true, 
            });
            this.logger.log(`[LOAD] Carga exitosa de ${entities.length} registros en la tabla '${repository.metadata.tableName}'.`);
        } catch (error) {
            this.logger.error(`Error durante el UPSERT en ${repository.metadata.tableName}:`, error);
        }
    }

    // --- Orquestación (E, T, L) ---

    async runETL(): Promise<void> {
        this.logger.log("=================================================");
        this.logger.log("====== INICIANDO FLUJO ETL: HUBSPOT a DWH =======");
        this.logger.log("=================================================");

        const now = new Date().toISOString();
        this.logger.log(`Hora de inicio: ${now}`);

        // --- 1. PROCESO DE LEADS (Contactos) ---
        try {
            this.logger.log("--- FASE LEADS ---");
            // E: Extracción
            const rawLeads = await this.hubspotService.extractAllLeads();
            
            // T: Transformación
            const transformedLeads = rawLeads.map(lead => this.transformLead(lead));
            
            // L: Carga (Upsert)
            await this.upsertBatch(this.leadsRepository, transformedLeads, 'hubspot_id');
        
        } catch (error) {
            this.logger.error(`Fallo crítico en el proceso de LEADS: ${error}`);
        }

        // --- 2. PROCESO DE DEALS (Oportunidades) ---
        try {
            this.logger.log("\n--- FASE DEALS ---");
            // E: Extracción
            const rawDeals = await this.hubspotService.extractAllDeals();

            // T: Transformación
            const transformedDeals = rawDeals.map(deal => this.transformDeal(deal));

            // L: Carga (Upsert)
            await this.upsertBatch(this.dealsRepository, transformedDeals, 'hubspot_id');

        } catch (error) {
            this.logger.error(`Fallo crítico en el proceso de DEALS: ${error}`);
        }

        this.logger.log("\n=================================================");
        this.logger.log("====== FLUJO ETL COMPLETADO CON ÉXITO =======");
        this.logger.log("=================================================");
    }
}
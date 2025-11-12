import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { HubspotService, HubspotLeadProperties, HubspotDealProperties } from './hubspot.service';
import { HubspotLead } from '../database/HubspotLead.entity';
import { HubspotDeal } from '../database/HubspotDeal.entity';

@Injectable()
export class EtlService {
    private readonly logger = new Logger(EtlService.name);
    
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
     * T: Aplica transformaciones a un registro de Lead pre-mapeado.
     * @param rawLead 
     * @returns 
     */
    private transformLead(rawLead: HubspotLeadProperties): HubspotLead {
        const now = new Date();

        const transformedLead = new HubspotLead();
        
        
        transformedLead.hubspot_id = rawLead.hubspot_id; 
        transformedLead.email = rawLead.email || 'N/A';
        
        transformedLead.full_name = `${rawLead.firstname || ''} ${rawLead.lastname || ''}`.trim(); 
        
        transformedLead.life_cycle_stage = rawLead.lifecyclestage || 'unknown';
        transformedLead.created_at = new Date(rawLead.createdate);
        
        transformedLead.updated_at_hubspot = new Date(rawLead.lastmodifieddate);
        transformedLead.last_etl_run = now; 
        
        return transformedLead;
    }

    /**
     * T: Aplica transformaciones a un registro de Deal pre-mapeado.
* @param rawDeal 
 * @returns 
 */
private transformDeal(rawDeal: HubspotDealProperties): HubspotDeal {
    const now = new Date();
    
    const transformedDeal = new HubspotDeal();

    transformedDeal.hubspot_id = rawDeal.hubspot_id;
    transformedDeal.name = rawDeal.dealname || 'Untitled Deal';
    
    transformedDeal.amount_usd = rawDeal.amount ? parseFloat(rawDeal.amount) : 0.00; 

    transformedDeal.is_high_value = transformedDeal.amount_usd >= this.HIGH_VALUE_THRESHOLD;

    transformedDeal.stage = rawDeal.dealstage || 'unknown';
    
    transformedDeal.created_at = rawDeal.createdate ? new Date(rawDeal.createdate) : new Date(0); // Usar Date(0) como fallback seguro (Epoch)

    transformedDeal.updated_at_hubspot = rawDeal.lastmodifieddate ? new Date(rawDeal.lastmodifieddate) : new Date(0);
    
    transformedDeal.close_date = rawDeal.closedate ? new Date(rawDeal.closedate) : null; 

    transformedDeal.last_etl_run = now; 

    return transformedDeal;
}

    // --- Carga (L) ---
    
    /**
     * L: Ejecuta la carga de datos en lotes (UPSERT).
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
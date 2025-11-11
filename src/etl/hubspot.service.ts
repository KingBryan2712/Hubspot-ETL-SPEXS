import { Injectable, Logger } from '@nestjs/common';

// MOCK DATA
const MOCK_HUBSPOT_RESPONSES = {
    // Nota: El ID L1001 aparece dos veces intencionalmente para simular un lote con duplicados.
    leads: {
        results: [
            { id: 'L1001', properties: { email: 'juan.perez@spexs.com', firstname: 'Juan', lastname: 'Perez', lifecyclestage: 'lead', createdate: '2024-01-01T10:00:00Z', hs_lastmodifieddate: '2024-10-01T15:00:00Z' } },
            { id: 'L1002', properties: { email: 'ana.gomez@spexs.com', firstname: 'Ana', lastname: 'Gomez', lifecyclestage: 'customer', createdate: '2024-02-15T12:00:00Z', hs_lastmodifieddate: '2024-10-15T09:00:00Z' } },
            { id: 'L1003', properties: { email: 'carlos.mora@spexs.com', firstname: 'Carlos', lastname: 'Mora', lifecyclestage: 'lead', createdate: '2024-03-20T11:00:00Z', hs_lastmodifieddate: '2024-03-20T11:00:00Z' } },
            { id: 'L1001', properties: { email: 'juan.perez.new@spexs.com', firstname: 'Juan', lastname: 'Perez (UPDATED)', lifecyclestage: 'customer', createdate: '2024-01-01T10:00:00Z', hs_lastmodifieddate: '2024-11-05T15:00:00Z' } }, 
        ],
        paging: { next: { after: 'next-page-token-leads-2' } }
    },
    deals: {
        results: [
            { id: 'D2001', properties: { dealname: 'Project Alpha', amount: 15000, dealstage: 'closedwon', closedate: '2024-10-25T11:00:00Z', createdate: '2024-03-01T10:00:00Z', hs_lastmodifieddate: '2024-10-25T11:00:00Z' } },
            { id: 'D2002', properties: { dealname: 'Client Beta', amount: 5000, dealstage: 'negotiation', closedate: null, createdate: '2024-05-20T14:00:00Z', hs_lastmodifieddate: '2024-10-28T18:00:00Z' } },
            { id: 'D2003', properties: { dealname: 'Enterprise Gamma', amount: 50000, dealstage: 'closedwon', closedate: '2024-11-01T11:00:00Z', createdate: '2024-06-10T10:00:00Z', hs_lastmodifieddate: '2024-11-01T11:00:00Z' } },
        ],
        paging: { next: { after: 'next-page-token-deals-2' } }
    }
};

@Injectable()
export class HubspotService {
    private readonly logger = new Logger(HubspotService.name);
    private readonly apiKey: string = 'HUBSPOT_PRIVATE_APP_TOKEN';

    /**
     * Simula la extracción de Leads con paginación y realiza desduplicación.
     */
    async extractAllLeads(): Promise<any[]> {
        this.logger.log(`[EXTRACT] Iniciando extracción de Leads (simulado).`);
        const response = MOCK_HUBSPOT_RESPONSES.leads;
        
        if (response.paging?.next?.after) {
            this.logger.warn(`Paginación detectada. En producción, se buclearía hasta obtener todos los datos.`);
        }

        // --- Lógica de Desduplicación (Prevención del error ON CONFLICT) ---
        const dedupedLeadsMap = new Map();
        
        for (const lead of response.results) {
            dedupedLeadsMap.set(lead.id, lead);
        }

        const dedupedResults = Array.from(dedupedLeadsMap.values());

        this.logger.log(`[EXTRACT] ${response.results.length} Leads extraídos (bruto). Desduplicados: ${dedupedResults.length}`);
        return dedupedResults;
    }

    /**
     * Simula la extracción de Deals con paginación.
     */
    async extractAllDeals(): Promise<any[]> {
        this.logger.log(`[EXTRACT] Iniciando extracción de Deals (simulado).`);
        const response = MOCK_HUBSPOT_RESPONSES.deals;

        this.logger.log(`[EXTRACT] ${response.results.length} Deals extraídos.`);
        return response.results;
    }
}
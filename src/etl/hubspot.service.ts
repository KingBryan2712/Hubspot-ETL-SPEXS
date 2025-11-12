import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type AxiosInstance = any; 

export interface HubspotLeadProperties {
  hubspot_id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  lifecyclestage: string;
  createdate: string;
  lastmodifieddate: string; 
}

export interface HubspotDealProperties {
  hubspot_id: string;
  dealname: string;
  amount: string;
  dealstage: string;
  createdate: string;
  lastmodifieddate: string;
  closedate: string | null;
}

interface HubspotResponse<T> {
  results: T[];
  paging?: {
    next: {
      after: string;
      link: string;
    };
  };
}

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  private readonly client: AxiosInstance; 
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('HUBSPOT_BASE_URL', 'https://api.hubapi.com');
    const apiKey = this.configService.get<string>('HUBSPOT_API_KEY');

    if (!apiKey) {
      this.logger.error('HUBSPOT_API_KEY no está configurado en .env. La extracción fallará.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });
  }

  private async fetchAllPages<T>(endpoint: string, properties: string[]): Promise<T[]> {
    this.logger.log(`[EXTRACT] Iniciando extracción de: ${endpoint}`);
    let allData: T[] = [];
    let afterToken: string | undefined = undefined;

    do {
      try {
        const response = await this.client.get(endpoint, {
          params: {
            properties: properties.join(','),
            limit: 100,
            ...(afterToken && { after: afterToken }),
          },
        });

        if (response.status !== 200) {
          this.logger.error(`Error ${response.status} al extraer ${endpoint}: ${JSON.stringify(response.data)}`);
          break;
        }

        const data = response.data as HubspotResponse<T>;
        
        allData = allData.concat(data.results);
        
        afterToken = data.paging?.next?.after;
        if (afterToken) {
          this.logger.log(`Página extraída. Obteniendo siguiente página usando token: ${afterToken}`);
        }

      } catch (error) {
        this.logger.error(`Error de red/conexión al extraer ${endpoint}: ${error}`);
        break;
      }
    } while (afterToken);

    this.logger.log(`[EXTRACT] Extracción de ${endpoint} completada. Total de registros: ${allData.length}`);
    return allData;
  }

  async extractAllLeads(): Promise<HubspotLeadProperties[]> {
    const contactProperties = [
  'email', 'firstname', 'lastname', 'phone', 'lifecyclestage', 
  'createdate', 'lastmodifieddate', 'hubspot_owner_id', 
];
    
    const contacts = await this.fetchAllPages<any>('/crm/v3/objects/contacts', contactProperties);

    return contacts.map(c => ({
      hubspot_id: c.id, 
      email: c.properties.email || '',
      firstname: c.properties.firstname || '',
      lastname: c.properties.lastname || '',
      phone: c.properties.phone || '',
      lifecyclestage: c.properties.lifecyclestage || 'new',
      createdate: c.properties.createdate,
      lastmodifieddate: c.properties.lastmodifieddate,
      owner_id: c.properties.hubspot_owner_id || null,
    }));
  }

  async extractAllDeals(): Promise<HubspotDealProperties[]> {
    const dealProperties = [
      'dealname', 'amount', 'dealstage', 
      'createdate', 'lastmodifieddate', 'closedate',
    ];
    
    const deals = await this.fetchAllPages<any>('/crm/v3/objects/deals', dealProperties);

    return deals.map(d => ({
      hubspot_id: d.id, 
      dealname: d.properties.dealname || '',
      amount: d.properties.amount || '0', 
      dealstage: d.properties.dealstage || 'unknown',
      createdate: d.properties.createdate,
      lastmodifieddate: d.properties.lastmodifieddate,
      closedate: d.properties.closedate || null,
    }));
  }
}
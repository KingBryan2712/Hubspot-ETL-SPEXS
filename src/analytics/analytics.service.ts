import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HubspotLead } from '../database/HubspotLead.entity';
import { HubspotDeal } from '../database/HubspotDeal.entity';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectRepository(HubspotLead)
        private leadsRepository: Repository<HubspotLead>,
        @InjectRepository(HubspotDeal)
        private dealsRepository: Repository<HubspotDeal>,
    ) {}

    /**
     * Consulta 1: Calcula la Tasa de Conversión de Lead a Cliente.
     * @returns Objeto con el total de leads, clientes y la tasa de conversión.
     */
    async getConversionRate(): Promise<any> {
        this.logger.log('Ejecutando consulta: Tasa de Conversión (Leads vs Clientes)');
        
        const leads = await this.leadsRepository.count();
        const customers = await this.leadsRepository.count({
            where: { life_cycle_stage: 'customer' },
        });

        const rate = leads > 0 ? (customers / leads) * 100 : 0;

        return {
            total_leads: leads,
            total_customers: customers,
            conversion_rate_percentage: parseFloat(rate.toFixed(2)),
            details: 'Calculado sobre la base de Leads en el Data Warehouse (PostgreSQL).'
        };
    }

    /**
     * Consulta 2: Desempeño de Deals por Etapa de Venta.
     * Muestra la suma de los Deals en etapas clave y los Deals de Alto Valor.
     * @returns Objeto con la suma de montos por etapas.
     */
    async getDealStagePerformance(): Promise<any> {
        this.logger.log('Ejecutando consulta: Desempeño de Deals por Etapa de Venta');

        const results = await this.dealsRepository
            .createQueryBuilder('deal')
            .select('deal.stage', 'stage')
            .addSelect('COUNT(deal.hubspot_id)', 'count')
            .addSelect('SUM(deal.amount_usd)', 'total_amount')
            .groupBy('deal.stage')
            .orderBy('total_amount', 'DESC')
            .getRawMany();

        const highValueDeals = await this.dealsRepository
            .createQueryBuilder('deal')
            .where('deal.is_high_value = :highValue', { highValue: true })
            .select('SUM(deal.amount_usd)', 'total_high_value_amount')
            .getRawOne();


        return {
            stage_summary: results.map(r => ({
                stage: r.stage,
                count: parseInt(r.count, 10),
                total_amount: parseFloat(r.total_amount).toFixed(2)
            })),
            high_value_analysis: {
                total_amount_high_value_deals: parseFloat(highValueDeals?.total_high_value_amount || 0).toFixed(2),
                threshold_usd: 10000 
            },
            details: 'Análisis de montos agregados directamente del Data Warehouse.'
        };
    }
}
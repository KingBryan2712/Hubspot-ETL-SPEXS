import { Controller, Get, Logger, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service'; 

@Controller('analytics')
export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);

    constructor(private readonly analyticsService: AnalyticsService) {}

    /**
     * Endpoint: /analytics/conversion
     * Objetivo: Muestra la Tasa de Conversión de Leads a Clientes.
     */
    @Get('conversion')
    async getConversionRate(@Res() res: Response) {
        try {
            const data = await this.analyticsService.getConversionRate();
            this.logger.log(`API: Conversion Rate consultada con éxito.`);
            return res.status(HttpStatus.OK).json({ 
                message: 'Tasa de conversión de Leads a Clientes obtenida.',
                data: data
            });
        } catch (error) {
            this.logger.error('Error al obtener la tasa de conversión:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error interno del servidor al procesar la analítica.',
            });
        }
    }

    /**
     * Endpoint: /analytics/deals-performance
     * Objetivo: Muestra el desempeño de montos por etapa de Deal.
     */
    @Get('deals-performance')
    async getDealPerformance(@Res() res: Response) {
        try {
            const data = await this.analyticsService.getDealStagePerformance();
            this.logger.log(`API: Deals Performance consultado con éxito.`);
            return res.status(HttpStatus.OK).json({ 
                message: 'Desempeño de Deals por etapa de venta obtenido.',
                data: data
            });
        } catch (error) {
            this.logger.error('Error al obtener el desempeño de deals:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error interno del servidor al procesar la analítica.',
            });
        }
    }
}
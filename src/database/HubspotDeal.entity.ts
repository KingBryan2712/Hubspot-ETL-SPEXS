import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('hubspot_deals')
export class HubspotDeal {
    /** * ID de HubSpot: Usado como clave primaria para la operación de UPSERT. */
    @PrimaryColumn({ type: 'varchar', length: 50 })
    hubspot_id!: string; 

    @Column({ type: 'varchar' })
    name!: string; 

    /** * Monto con precisión de 2 decimales para datos financieros. */
    @Column({ type: 'numeric', precision: 10, scale: 2 })
    amount_usd!: number; 

    @Column({ type: 'varchar' })
    stage!: string; 

    @Column({ type: 'timestamp', nullable: true })
    close_date!: Date | null; 

    /** * Campo Transformado: Indica si el Deal supera un umbral de alto valor. */
    @Column({ type: 'boolean' })
    is_high_value!: boolean; 

    @Column({ type: 'timestamp' })
    created_at!: Date; 

    @Column({ type: 'timestamp' })
    updated_at_hubspot!: Date; 

    /** * Campo de Auditoría: Marca temporal de la última ejecución exitosa del ETL. */
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    last_etl_run!: Date; 
}
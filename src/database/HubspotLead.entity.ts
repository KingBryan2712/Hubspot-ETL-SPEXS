import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('hubspot_leads')
export class HubspotLead {
    /** * ID de HubSpot: Usado como clave primaria para la operación de UPSERT. */
    @PrimaryColumn({ type: 'varchar', length: 50 })
    hubspot_id!: string; 

    @Column({ type: 'varchar' })
    email!: string; 

    /** * Campo Transformado: Concatenación de nombre y apellido. */
    @Column({ type: 'varchar' })
    full_name!: string; 

    @Column({ type: 'varchar' })
    life_cycle_stage!: string; 

    @Column({ type: 'timestamp' })
    created_at!: Date; 

    @Column({ type: 'timestamp' })
    updated_at_hubspot!: Date; 

    /** * Campo de Auditoría: Marca temporal de la última ejecución exitosa del ETL. */
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    last_etl_run!: Date; 
}
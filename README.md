🚀 Prueba Técnica: ETL de HubSpot a Data Warehouse (DWH) con NestJS

Este proyecto implementa una solución completa para la extracción, transformación y carga (ETL) de datos de Leads y Deals desde una fuente simulada de HubSpot hacia un Data Warehouse (DWH) en PostgreSQL, finalizando con la exposición de una capa de APIs para analítica.

🛠️ Herramientas Utilizadas

|

| Categoría | Herramienta | Versión |
| Framework Principal | NestJS | (Actual) |
| Lenguaje | TypeScript | (Actual) |
| Cliente API | Axios | (Actual) |
| Data Warehouse | PostgreSQL | latest (Docker) |
| ORM / DB Layer | TypeORM | (Actual) |
| Infraestructura | Docker | (Actual) |
| Testing/Consumo | Postman | (Opcional) |

💡 Decisiones Técnicas

1. Arquitectura de la Aplicación (NestJS)

Se optó por NestJS y TypeScript debido a su estructura modular y enfoque en la arquitectura limpia, lo cual es ideal para flujos de datos complejos como el ETL. La solución está dividida en dos módulos principales:

EtlModule: Maneja la orquestación de la carga de datos (la escritura).

AnalyticsModule: Maneja la capa de consumo de datos y las consultas analíticas (la lectura).

2. Elección del Data Warehouse (PostgreSQL)

Se seleccionó PostgreSQL por ser un motor de base de datos relacional robusto, estándar en la industria para entornos DWH. Es escalable, soporta SQL avanzado (necesario para las agregaciones analíticas) y se integra eficientemente con TypeORM.

3. Buenas Prácticas de Carga: Idempotencia

Para garantizar la re-ejecución segura del ETL (esencial en producción), se implementó la estrategia UPSERT (Insert or Update) en la fase de Load mediante TypeORM.

Clave de Conflicto: El hubspot_id del registro.

Beneficio: Previene la duplicación de datos al actualizar registros existentes, asegurando que la base de datos siempre refleje el estado más reciente de HubSpot.

4. Transformaciones Clave

Se aplicaron transformaciones sencillas en el EtlService para enriquecer y preparar los datos para la analítica:

Leads: Creación del campo full_name a partir de firstname y lastname.

Deals: Creación del campo booleano is_high_value (True si amount_usd >= 10000), lo que permite a la API segmentar la analítica de valor sin lógica compleja en la capa de análisis.

▶️ Pasos para Ejecutar la Solución

Prerrequisitos

Node.js (v18+) y npm.

Docker (para la base de datos).

Recomendado: Cliente REST como Postman o VS Code Thunder Client para probar las APIs.

### Paso 1: Configurar Variables de Entorno (Clave API)

1.  Crea un archivo llamado `.env` en la raíz del proyecto.
2.  Añade las siguientes variables con tu token de acceso:

```env
# Archivo .env
HUBSPOT_BASE_URL=https://api.hubapi.com
HUBSPOT_API_KEY=tu_token_de_acceso_real_de_hubspot (adjunto en el correo electronico)

# Paso 1.2: Configurar PostgreSQL con Docker

Ejecuta estos comandos en tu terminal. El primer comando levanta el contenedor de PostgreSQL, y el segundo crea la base de datos requerida (spexs_dwh).

# 1. Iniciar el contenedor (se corre en el puerto 5432)
docker run --name postgres-spexs -d -e POSTGRES_PASSWORD=spexs_secret -p 5432:5432 postgres:latest

# 2. Crear la base de datos que la aplicación busca
docker exec -it postgres-spexs createdb -U postgres spexs_dwh




Paso 2: Instalar e Iniciar la Aplicación

Ejecuta estos comandos desde la carpeta raíz del proyecto (hubspot-etl-api):

# 1. Instalar dependencias del proyecto
npm install

# 2. Iniciar la aplicación y el ETL (Development Mode)
# El proceso ETL se dispara automáticamente aquí.
npm run start:dev




Paso 3: Verificación del Contenido del DWH (PostgreSQL)

Una vez que el ETL finalice (verás el log FLUJO ETL COMPLETADO CON ÉXITO), puedes confirmar que los datos se cargaron y transformaron correctamente en la base de datos.

# Ingresar a la consola de PostgreSQL (psql) en Docker:

docker exec -it postgres-spexs psql -U postgres -d spexs_dwh


# Verificar la tabla de Leads (Transformación full_name):

SELECT hubspot_id, full_name, life_cycle_stage, updated_at_hubspot FROM hubspot_leads;


(Deberías ver los 4 contactos extraídos. Uno de ellos debe tener el life_cycle_stage como 'customer'.)

# Verificar la tabla de Deals (Transformación is_high_value):

SELECT hubspot_id, name, amount_usd, is_high_value FROM hubspot_deals;


(Deberías ver los 2 deals. Los deals con amount_usd >= 10000 deben tener is_high_value = t.)

# Salir de PostgreSQL:

\q




Paso 4: Probar los Endpoints Analíticos (API)

# Utiliza Postman o tu herramienta de cliente REST preferida para verificar que la capa de análisis funciona correctamente consumiendo los datos del DWH.

Análisis

URL de Prueba (Método GET)

# Tasa de Conversión

http://localhost:3000/analytics/conversion

# Rendimiento de Deals

http://localhost:3000/analytics/deals-performance
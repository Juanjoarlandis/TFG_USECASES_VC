# ISSUER_COORD

Este servicio actúa como coordinador y emisor de credenciales verificables (Verifiable Credentials) de diferentes tipos (p.ej., Credenciales de Identidad, Credenciales de Pasaporte y Credenciales de Registro Laboral), integrándose con el ecosistema de walt.id para la emisión, firma y gestión del ciclo de vida de las credenciales.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Características Principales](#características-principales)
- [Requisitos Previos](#requisitos-previos)
- [Variables de Entorno](#variables-de-entorno)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Endpoints](#endpoints)
- [Ejemplos de Credenciales](#ejemplos-de-credenciales)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Despliegue con Docker/Docker Compose](#despliegue-con-dockerdocker-compose)
- [Manejo de Errores](#manejo-de-errores)
- [Logging](#logging)
- [Testing](#testing)
- [Contribución](#contribución)
- [Licencia](#licencia)

## Descripción

`ISSUER_COORD` es un servicio que coordina la emisión de credenciales verificables (VC) para diferentes casos de uso. Se integra con:

- **walt.id**: para la emisión y firma de credenciales.
- **MongoDB**: para almacenar DIDs de los issuers.
- Almacenamiento en ficheros locales: para registrar credenciales emitidas y su estado (esto se puede mejorar o cambiar por otra BBDD en el futuro).

## Arquitectura

1. El servicio se conecta a walt.id para generar DIDs y emitir credenciales.
2. Los DIDs de cada issuer se almacenan en MongoDB.
3. Las credenciales emitidas se guardan de forma local en ficheros JSON.
4. Las operaciones de emisión y actualización de estado se realizan a través de endpoints expuestos por el servicio.

La comunicación con la base de datos y walt.id se realiza a través de HTTP. La lógica de negocio está separada en capas (controladores, servicios, repositorios).

## Características Principales

- Creación y registro de DIDs para múltiples issuers.
- Emisión de credenciales en distintos modos:  
  - **OpenID4VC**: retorna una `issuanceUrl` para que el holder obtenga la credencial.
  - **Direct**: retorna una credencial firmada directamente.
- Almacenamiento de DIDs en MongoDB, eliminando la necesidad de ficheros locales para ellos.
- Almacenamiento de credenciales y su estado en ficheros locales (directorio `data`).
- Endpoints REST para CRUD de credenciales, ping, esquemas y easter eggs.

## Requisitos Previos

- Node.js versión 18 o superior.
- MongoDB 5.x o 6.x.
- Docker y Docker Compose (opcional, si desea ejecutar en contenedores).
- Walt.id API u otro backend que ofrezca endpoints similares (según la integración actual).

## Variables de Entorno

En `.env` se configuran variables como:

- `VCJWT`, `VCLD`, `MODE` (modo de emisión de credenciales: `open` o `direct`).
- `LOG_LEVEL`: Nivel de logging (`debug`, `info`, `warn`, `error`).
- `WALTID_URL`: URL del servicio walt.id API.
- `VAULT_TRANSIT_URL`: URL del servicio de administración de llaves (Vault).
- `MONGODB_URI`: Cadena de conexión a MongoDB.
- `ISS_URL`: URL pública del issuer_coord.
- `ROLE_ID_ISSUERX` y `SECRET_ID_ISSUERX`: Credenciales para crear DIDs.

Ejemplo de `.env`:

```env
MODE=open
LOG_LEVEL=debug
ISS_URL=http://issuer_coord:5500
WALTID_URL=http://issuer-api:7002
VAULT_TRANSIT_URL=http://vault:8200/v1/transit
MONGODB_URI=mongodb://mongo-issuer_coord:27017/issuercoord
ROLE_ID_ISSUER1=<uuid>
SECRET_ID_ISSUER1=<uuid>
ROLE_ID_ISSUER2=<uuid>
SECRET_ID_ISSUER2=<uuid>
ROLE_ID_ISSUER3=<uuid>
SECRET_ID_ISSUER3=<uuid>
```

## Instalación

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```

## Ejecución

### Modo desarrollo

```bash
npm run dev
```

Esto iniciará el servicio en modo desarrollo, conectando a la base de datos y mostrando logs en consola.

### Modo producción

Construir y ejecutar:

```bash
npm run build
npm start
```

El servicio escuchará en el puerto 5500 por defecto.

## Endpoints

- `GET /ping`: Verifica que el servicio está corriendo, responde "pong".
- `GET /did`: Crea DIDs para issuer1, issuer2, issuer3 y los almacena en MongoDB.
- `GET /.well-known/did.json?issuer=issuer1|issuer2|issuer3`: Obtiene el DID Document del issuer indicado.
- `GET /did/issuers`: Lista todos los DIDs registrados.
- `GET /schema`: Devuelve un esquema JSON de ejemplo.
- `POST /credentials/issue`: Emite una credencial. Requiere `type` en el body.
- `POST /statusCallback/:sessionId`: Actualiza el estado de la credencial a 'issued' tras callback.
- `GET /credentials`: Lista todas las credenciales locales.
- `GET /credentials/:id`: Obtiene una credencial por ID numérico.
- `POST /credentials/status`: Actualiza el estado de una credencial.
- `DELETE /credentials/:id`: Elimina una credencial.
- `GET /.hidden-easter-egg`: Devuelve un mensaje Easter Egg.

## Ejemplos de Credenciales

En `Credenciales_ejemplos.txt` se incluyen ejemplos de credenciales de distinto tipo (Registro Laboral, Alta Seguridad Social, Pasaporte). Estos sirven como referencia para entender el formato de las credenciales emitidas.

## Estructura del Proyecto

- `src/App/controllers`: Controladores HTTP, exponen endpoints.
- `src/App/services`: Lógica de negocio (DIDService, CredentialService).
- `src/App/repositories`: Acceso a persistencia (DIDRepository en MongoDB, FileRepository en ficheros).
- `src/App/models`: Definiciones de modelos, esquemas y clases auxiliares.
- `src/App/errors`: Definiciones de errores personalizados.
- `src/App/routes`: Archivo principal de enrutamiento (`routes.ts`).
- `src/App/db`: Conexión a MongoDB (`mongoose.ts`).
- `src/logger.ts`: Configuración de logging con Winston.
- `src/shim.ts`: Setup global del Buffer.
- `data/`: Directorios creados para almacenar credenciales, logs, status, etc.

## Despliegue con Docker/Docker Compose

Un ejemplo de `docker-compose.yaml` se encuentra en el repositorio. Incluye:

- `issuer_coord` (este servicio)
- `mongo-issuer_coord` (la base de datos Mongo)

Para desplegar:

```bash
docker-compose up --build
```

El servicio quedará disponible en `http://localhost:5500`.

## Manejo de Errores

El servicio utiliza clases de error personalizadas (`MissingParameterError`, `NotFoundError`, etc.) para indicar errores específicos. Responde con códigos HTTP apropiados:

- 400 para parámetros faltantes o formato incorrecto.
- 404 para recursos no encontrados.
- 500 para errores internos.

Los errores se loguean con Winston.

## Logging

El servicio utiliza Winston para logging. Por defecto:

- Logs en consola, nivel `info` o `debug` (configurable).
- Logs en archivo `data/logs/logs.log`.

La metadata sensible se sanea antes de loguearse.

## Testing

Se recomienda implementar pruebas con Jest o Mocha, cubriendo:
- Servicios (DIDService, CredentialService).
- Controladores (maincontroller).
- Repositorios (DIDRepository, FileRepository).

Actualmente no se incluyen pruebas por defecto, pero la arquitectura facilita su incorporación.

## Contribución

1. Haz un fork del repositorio.
2. Crea una rama de característica (`feature/my-feature`).
3. Haz commits descriptivos.
4. Crea un Pull Request.

Se agradece el reporte de issues, sugerencias y contribuciones.

## Licencia

Este proyecto está bajo la Licencia MIT (o la que corresponda). Revisa el archivo LICENSE para más detalles.

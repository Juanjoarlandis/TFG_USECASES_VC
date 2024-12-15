# Verifier Backend

## Descripción
Este proyecto implementa un backend para la verificación de credenciales verificables en el contexto de la Seguridad Social. Permite la verificación de credenciales, la emisión de credenciales de alta en la Seguridad Social, la revocación de credenciales y la gestión de usuarios.

## Características principales
- **Verificación de credenciales verificables** utilizando OpenID for Verifiable Credentials (OID4VC).
- **Emisión de credenciales verificables** en formato JWT.
- **Gestión de usuarios**: registro y actualización de datos de los usuarios con datos cifrados.
- **Revocación de credenciales**: gestión de credenciales revocadas.

## Dependencias principales
- **Express**: Framework web para Node.js.
- **Mongoose**: ORM para MongoDB.
- **jsonwebtoken**: Generación y verificación de JWTs.
- **axios**: Cliente HTTP para realizar peticiones externas.
- **dotenv**: Manejo de variables de entorno.
- **mongoose-encryption**: Cifrado de campos sensibles en MongoDB.
- **uuid**: Generación de identificadores únicos.

## Requisitos previos
1. **Node.js** (versión 16 o superior).
2. **MongoDB** (versión 4.0 o superior).
3. **Docker** (opcional para ejecutar la imagen del backend).

## Instalación

1. Clonar este repositorio:
   ```bash
   git clone https://github.com/tu-repositorio/verifier-backend.git
   cd verifier-backend/backend
   ```

2. Instalar las dependencias:
   ```bash
   npm install
   ```

3. Configurar las variables de entorno. Crear un archivo `.env` basado en el archivo `.env.example` y rellenar los valores necesarios:
   ```env
   WALTID_VERIFIER_URL=http://verifier-api:7003
   WALTID_ISSUER_URL=http://issuer-api:7002
   VERIFIER_COORD_PUBLIC_URL=http://backend:3001
   MONGO_URI=mongodb://mongo-backend:27017/seguridadSocial
   PORT=3001
   ISS_COORD_URL=http://issuer_coord:5500
   NODE_ENV=production
   JWT_SECRET='your-jwt-secret'
   JWT_REFRESH_SECRET='your-refresh-jwt-secret'
   ENCRYPTION_KEY='your-encryption-key'
   SIGNING_KEY='your-signing-key'
   ISSUER_KEY_JWK={...}
   CREDENTIAL_CONFIGURATION_ID=CustomIdentityCredential_jwt_vc_json
   ```

4. Ejecutar el servidor:
   ```bash
   npm start
   ```

5. Acceder al servidor en: [http://localhost:3001](http://localhost:3001).

## Uso
### Rutas principales
- **Verificación de credenciales**
  - POST `/verification/offer`: Genera una URL de oferta de verificación.
  - POST `/verification/statusCallback/:stateId`: Callback para el estado de verificación.
  - GET `/verification/session/:stateId`: Recupera el estado de una sesión de verificación.

- **Emisión de credenciales**
  - POST `/issuance/offer`: Genera una oferta de emisión de credencial.
  - POST `/issuance/statusCallback/:stateId`: Callback para el estado de emisión.
  - GET `/issuance/session/:stateId`: Recupera el estado de una sesión de emisión.

- **Gestión de usuarios**
  - GET `/user/:dni`: Recupera los datos de un usuario por DNI.

- **Revocación de credenciales**
  - POST `/revocar/credencial`: Revoca una credencial específica.

- **Autenticación**
  - POST `/auth/refresh`: Genera nuevos tokens de acceso y refresco.

## Estructura del proyecto
```
backend/
├── app.js                # Archivo principal
├── package.json          # Configuración del proyecto
├── Dockerfile            # Archivo para la creación de imágenes Docker
├── .env                  # Variables de entorno
├── src/
│   ├── controllers/      # Controladores para manejar la lógica de negocio
│   ├── middleware/       # Middlewares personalizados
│   ├── models/           # Modelos de datos (Mongoose)
│   ├── routes/           # Definición de rutas
│   └── utils/            # Utilidades y helpers
└── signing_key_base64.txt
```

## Docker
El backend incluye un archivo `Dockerfile` para ejecutar el proyecto en un contenedor Docker. Para construir y ejecutar la imagen:

1. Construir la imagen:
   ```bash
   docker build -t verifier-backend .
   ```

2. Ejecutar el contenedor:
   ```bash
   docker run -p 3001:3001 --env-file .env verifier-backend
   ```

## Contribuciones
Si deseas contribuir al proyecto, por favor sigue los pasos habituales:
1. Haz un fork del repositorio.
2. Crea una nueva rama para tu característica (`git checkout -b feature/nueva-caracteristica`).
3. Realiza tus cambios y haz commit (`git commit -m 'Añadir nueva característica'`).
4. Envía un pull request.

## Licencia
Este proyecto está bajo la licencia MIT. Para más información, revisa el archivo LICENSE.

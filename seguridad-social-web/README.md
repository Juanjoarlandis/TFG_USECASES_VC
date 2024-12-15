# Seguridad Social Web - Proyecto Global

## Descripción General

Este proyecto proporciona una solución integral para la gestión de credenciales verificables en el contexto de la Seguridad Social. Consiste en varios módulos independientes que interactúan entre sí para proporcionar servicios como emisión de credenciales, verificación de identidad y una interfaz web accesible.

## Arquitectura del Proyecto
El proyecto consta de los siguientes módulos:

### 1. **Frontend**
   - **Descripción**: Interfaz web desarrollada con React para la interacción del usuario.
   - **Tecnologías**: React, Redux, TailwindCSS, Axios.
   - **Características principales**:
     - Registro y verificación de credenciales.
     - Dashboard personal para la gestión de datos.
     - Diseño responsivo.

### 2. **Backend**
   - **Descripción**: Servidor que gestiona la lógica de negocio, como la verificación de credenciales y el almacenamiento de datos de usuarios.
   - **Tecnologías**: Node.js, Express, MongoDB.

### 3. **Issuer Coordinator**
   - **Descripción**: Servicio dedicado a la emisión de credenciales verificables.
   - **Tecnologías**: Node.js, MongoDB.

### 4. **Vault**
   - **Descripción**: Sistema seguro de gestión de claves utilizado para almacenar información sensible y realizar operaciones criptográficas.
   - **Configuraciones principales**:
     - Configurado con políticas específicas para diferentes roles.
     - Soporte para AppRoles utilizados por los módulos.

## Lanzamiento del Proyecto
### Requisitos Previos

1. **Software Necesario**:
   - Docker y Docker Compose.
   - Node.js y npm (opcional para desarrollo local del frontend).

2. **Configuraciones Iniciales**:
   - Crear una red Docker externa llamada `my_network`:
     ```bash
     docker network create my_network
     ```

   - Configurar los certificados SSL para el frontend en `frontend/certs/`.

   - Configurar las variables de entorno necesarias para cada módulo.

### Pasos para Lanzar el Proyecto
1. **Configurar y Lanzar Vault**
   - Construir la imagen de inicialización de Vault:
     ```bash
     docker-compose build vault-init
     ```
   - Iniciar Vault:
     ```bash
     docker-compose up -d vault
     ```
   - Ejecutar el contenedor de inicialización:
     ```bash
     docker-compose up vault-init
     ```

2. **Lanzar los Servicios**
   - Iniciar todos los módulos utilizando el archivo `docker-compose.yaml` principal:
     ```bash
     docker-compose up -d
     ```

3. **Acceso a la Aplicación**
   - Frontend: [https://localhost](https://localhost)
   - Backend: Disponible en [http://localhost:3001](http://localhost:3001) para consumo interno por otros servicios.

### Configuración Adicional de Vault
Si necesitas realizar configuraciones adicionales de Vault, puedes usar los siguientes comandos:

- **Iniciar sesión en Vault**:
  ```bash
  export VAULT_ADDR='http://127.0.0.1:8200'
  vault login <root-token>
  ```

- **Aplicar políticas**:
  ```bash
  vault policy write issuer1-policy ./vault-init/issuer1-policy.hcl
  ```

- **Crear AppRoles**:
  ```bash
  vault write auth/approle/role/issuer1-role token_policies="issuer1-policy"
  ```

## Estructura del Proyecto
- **frontend/**: Contiene el código fuente del frontend.
- **backend/**: Contiene el código fuente del backend.
- **issuer_coord/**: Servicio de coordinación de emisores.
- **vault-init/**: Configuraciones y scripts para la inicialización de Vault.

## Contribuir
Si deseas contribuir:

1. Haz un fork del repositorio.
2. Crea una rama para tus cambios:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y haz commit:
   ```bash
   git commit -m "Descripción de los cambios"
   ```
4. Haz un push de tus cambios y crea un Pull Request.

## Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

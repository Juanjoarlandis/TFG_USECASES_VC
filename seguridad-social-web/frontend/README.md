# Seguridad Social Web - Frontend

Este proyecto es el frontend de la aplicación web para la gestión de trámites en la Seguridad Social. Está desarrollado en React con soporte para TailwindCSS, Redux y múltiples idiomas mediante i18next.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (versión 16 o superior)
- npm (versión 8 o superior)
- Docker (opcional, para despliegue)

## Instalación

1. Clona este repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd seguridad-social-web
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Configura las variables de entorno en el archivo `.env` (por defecto ya existe uno):

   ```env
   REACT_APP_BACKEND_URL=https://localhost/backend
   ```

4. (Opcional) Configura los certificados SSL para un despliegue local seguro en la carpeta `certs`.

## Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

### `npm start`

Ejecuta la aplicación en modo de desarrollo. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

La página se recargará automáticamente si haces cambios en el código.

### `npm run build`

Crea una versión optimizada de la aplicación para producción en la carpeta `build`. Los archivos generados están listos para ser desplegados.

### `npm test`

Ejecuta las pruebas en modo interactivo.

## Docker

### Construcción de la Imagen

Para crear una imagen Docker del frontend:

```bash
docker build -t seguridad-social-web:latest .
```

### Ejecución de la Imagen

Ejecuta el contenedor:

```bash
docker run -d -p 3000:3000 seguridad-social-web:latest
```

Accede a la aplicación en [http://localhost:3000](http://localhost:3000).

## Estructura del Proyecto

- `src/`
  - `components/`: Componentes reutilizables como el Header y Footer.
  - `pages/`: Páginas principales de la aplicación (e.g., Home, Register, Dashboard).
  - `store/`: Configuración de Redux y slices.
  - `services/`: Funciones para interactuar con la API backend.
  - `utils/`: Utilidades y validaciones comunes.
  - `i18n.js`: Configuración para la internacionalización.
- `public/`: Archivos estáticos como `index.html` y manifest.json.

## Funcionalidades Principales

- **Registro y Verificación**: Los usuarios pueden verificar su identidad escaneando un código QR con su wallet WaltId.
- **Dashboard Personal**: Acceso a información y servicios personalizados, como credenciales y prestaciones activas.
- **Alta en Seguridad Social**: Proceso guiado para darse de alta mediante credenciales verificables.
- **Internacionalización**: Disponible en múltiples idiomas.
- **Diseño Responsivo**: Adaptado para dispositivos móviles y de escritorio.

## Tecnologías Usadas

- React
- Redux Toolkit
- TailwindCSS
- i18next (internacionalización)
- Axios (para peticiones HTTP)
- QRCode.react
- Framer Motion (animaciones)
- React Router
- Docker (para despliegue)

## Contribuir

Si deseas contribuir al desarrollo, por favor:

1. Realiza un fork del repositorio.
2. Crea una rama para tu feature o corrección de bug:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y haz commit:
   ```bash
   git commit -m "Descripción de los cambios realizados"
   ```
4. Haz un push de tus cambios a tu fork:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
5. Crea un Pull Request.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

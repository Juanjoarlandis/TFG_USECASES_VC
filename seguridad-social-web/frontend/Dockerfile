# 1) Etapa de build de la aplicación
FROM node:16 AS build

# Establecemos /app como directorio de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias (package.json y package-lock.json)
COPY package*.json .

# Instalamos dependencias (opción --legacy-peer-deps para evitar ciertos conflictos de versiones)
RUN npm install --legacy-peer-deps

# Copiamos todo el código fuente al contenedor
COPY . .

# Ejecutamos el build, generando la carpeta /app/build con los archivos estáticos optimizados
RUN npm run build


# 2) Etapa de "runtime" para servir los archivos estáticos
FROM node:16-alpine

# Establecemos de nuevo /app como directorio de trabajo
WORKDIR /app

# Instalamos globalmente 'serve', un pequeño servidor para archivos estáticos
RUN npm install -g serve

# Copiamos desde la etapa anterior (build) únicamente la carpeta /app/build al directorio de trabajo
COPY --from=build /app/build .

# Exponemos el puerto 3000 dentro del contenedor
EXPOSE 3000

# Comando por defecto: usar 'serve' para servir los archivos estáticos en el puerto 3000
CMD ["serve", "-s", ".", "-l", "3000"]

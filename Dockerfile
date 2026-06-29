# ==========================================
# Etapa 1: Dependencias de desarrollo y compilación
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo las de desarrollo para compilar)
RUN npm ci

# Copiar el resto del código del proyecto
COPY . .

# Compilar el proyecto (genera la carpeta /dist)
RUN npm run build

# Eliminar dependencias de desarrollo y dejar solo las de producción
RUN npm prune --production

# ==========================================
# Etapa 2: Entorno de ejecución en producción
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Variables de entorno por defecto para producción
ENV NODE_ENV=production

# Copiar desde la etapa 'builder' solo lo estrictamente necesario
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Exponer el puerto nativo que usa NestJS por defecto (o el que uses)
EXPOSE 3000

# Comando para arrancar la aplicación usando Node directamente (no npm run start:prod)
CMD ["node", "dist/main"]
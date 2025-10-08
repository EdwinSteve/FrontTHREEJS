
# Etapa 1: Construcción del proyecto
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Generar build con Parcel
RUN npx parcel build src/index.html --dist-dir dist

# Etapa 2: Servir los archivos estáticos con Nginx
FROM nginx:alpine

# Copiar el build desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]



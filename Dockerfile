FROM node:20-alpine as base

WORKDIR /usr/src/app

# Copia definizioni dipendenze e installa
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force

# Copia tutto il codice
COPY . .

# Espone la porta di sviluppo Vite
EXPOSE 3000

# Per semplicità di sviluppo avviamo il server Vite
CMD ["npm", "run", "dev"]
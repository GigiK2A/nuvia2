FROM node:20-alpine as base

# Imposta la cartella di lavoro
WORKDIR /usr/src/app

# Copia i file di definizione delle dipendenze
COPY package.json package-lock.json* ./

# Installa le dipendenze
RUN npm install --production && npm cache clean --force

# Copia il resto del codice
COPY . .

# Espone la porta del server
EXPOSE 3001

# Comando di avvio
CMD ["npm", "start"]
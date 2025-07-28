FROM node:20-alpine

# Imposta la directory di lavoro
WORKDIR /usr/src/app

# Copia il manifest delle dipendenze
COPY package.json package-lock.json* ./

# Installa tutte le dipendenze (incluse quelle di sviluppo per la build)
RUN npm install && npm cache clean --force

# Copia il resto del codice sorgente
COPY . .

# Esegue il build per produrre il bundle del server e del client
RUN npm run build

# Espone la porta su cui il server ascolta
EXPOSE 5000

# Comando di avvio in produzione
CMD ["npm", "run", "start"]
# Nuvia AI Agent - Guida alla Migrazione

## Contenuto dell'archivio

Questo archivio contiene tutto il necessario per migrare il progetto Nuvia:

### 📁 Struttura del progetto
- `client/` - Frontend React con TypeScript
- `server/` - Backend Express con TypeScript  
- `shared/` - Codice condiviso (schemi, tipi)
- `prisma/` - Configurazione database ORM
- `uploads/` - File caricati dagli utenti
- `logs/` - File di log dell'applicazione

### ⚙️ File di configurazione
- `package.json` - Dipendenze Node.js
- `tsconfig.json` - Configurazione TypeScript
- `vite.config.ts` - Configurazione build frontend
- `tailwind.config.ts` - Configurazione CSS
- `.env.export` - **Variabili d'ambiente (IMPORTANTE)**

### 💾 Database
- `database_backup.sql` - Dump completo PostgreSQL
- `DATABASE_RESTORE_INSTRUCTIONS.md` - Istruzioni ripristino

## 🚀 Passi per la migrazione

### 1. Preparazione ambiente
```bash
# Clona il progetto da questo archivio
unzip nuvia-project-export.zip
cd nuvia-project-export

# Installa Node.js 18+ e PostgreSQL 12+
npm install
```

### 2. Configurazione database
```bash
# Crea nuovo database PostgreSQL
createdb nuvia_db

# Ripristina i dati
psql nuvia_db < database_backup.sql
```

### 3. Variabili d'ambiente
```bash
# Rinomina e configura il file .env
mv .env.export .env

# Modifica .env con i tuoi valori:
# - DATABASE_URL del nuovo database
# - API keys (Google, OpenAI, ecc.)
# - Domini e segreti per il deployment
```

### 4. Avvio applicazione
```bash
# Sviluppo
npm run dev

# Produzione
npm run build
npm start
```

## 🔑 Servizi esterni richiesti

Per il funzionamento completo, configura:

1. **Database PostgreSQL** - Per dati persistenti
2. **Google AI (Gemini)** - Per l'intelligenza artificiale
3. **Gmail SMTP** - Per promemoria email
4. **Google OAuth** - Per autenticazione (opzionale)
5. **OpenAI API** - Backup AI provider (opzionale)

## 📞 Supporto

Per domande sulla migrazione, contatta il team di sviluppo.

Data esportazione: 2025-07-28T17:05:29.646Z
Versione: Nuvia AI Agent v1.0

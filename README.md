# Nuvia AI Assistant – Self‑Hosted Setup

Questo repository contiene una versione scheletro della piattaforma **Nuvia** da installare su infrastruttura proprietaria.  
L'obiettivo è fornire una base da cui sviluppare un'assistente AI multifunzione composto da backend Node.js/Express, frontend React e database PostgreSQL, analogamente all'implementazione originaria su Replit.

## Struttura del progetto

```text
nuvia/
├── backend/         # Codice del server Node.js/Express
│   ├── Dockerfile
│   ├── index.js      # Punto di ingresso dell'applicazione Express
│   ├── package.json
│   ├── package-lock.json (facoltativo)
│   └── .env.example  # Esempio di variabili d'ambiente
├── frontend/        # Applicazione React
│   ├── Dockerfile
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── components/
│   └── package.json
├── docker-compose.yml  # Coordinamento dei container backend, frontend e database
└── README.md
```

## Avvio rapido con Docker Compose

L'infrastruttura è predisposta per l'uso di **Docker** e **docker‑compose** in modo da replicare facilmente l'ambiente Replit.

1. **Prerequisiti**: assicurati di avere installato Docker e docker‑compose (o Docker Desktop) sul tuo host.
2. **Configura le variabili d'ambiente**: copia il file `backend/.env.example` in `backend/.env` e aggiorna i valori (es. credenziali del database, chiavi API per OpenAI/Gemini, Google OAuth, ecc.).
3. **Avvio**: nella directory `nuvia/` esegui:
   ```bash
   docker‑compose up --build
   ```
   Questo comando costruirà le immagini per il backend e il frontend, avvierà un'istanza PostgreSQL con un volume persistente, effettuerà eventuali migrazioni e renderà i servizi disponibili sui porti specificati.

## Note sui componenti

### Backend (`/backend`)
Il backend è una applicazione Node.js basata su Express. Offre:

* **API REST** per funzionalità di chat, generazione codice, documenti, calendario e autenticazione.  
* **Gestione database** tramite la libreria `pg` per interfacciarsi con PostgreSQL.  
* **Variabili d'ambiente** lette da `.env` grazie a `dotenv`.  
* **Middleware standard**: `cors` per le richieste cross‑origin, `express.json()` per il parsing JSON, ecc.

Le API sono volutamente lasciate come placeholder: dovrai implementare la logica specifica (integrazione con OpenAI/Gemini, generatore PDF/Word, salvataggio progetti, ecc.).

### Frontend (`/frontend`)
Il frontend utilizza React con una configurazione minima. È pensato come punto di partenza per un'interfaccia utente moderna basata su **Tailwind CSS** e **Framer Motion**, secondo quanto indicato nel progetto originale. Potrai installare le librerie mancanti e ampliare i componenti all'interno della directory `src/components/`.

### Database
Il file `docker-compose.yml` definisce un servizio `db` basato sull'immagine ufficiale di PostgreSQL. Viene creato un volume dedicato in modo che i dati persistano tra i riavvii. Le credenziali e il nome del database sono definiti tramite variabili d'ambiente nel file compose.

## Personalizzazione e ulteriori sviluppi

Questo repository funge da base modulare. Dovrai:

* **Implementare le API**: completare i controller Express per fornire tutte le funzionalità (chatbot, generatore di documenti, editor di codice, calendari, ecc.).
* **Integrare l'AI**: usare le librerie OpenAI/Gemini a seconda delle licenze e dei piani in uso.  
* **Implementare l'autenticazione**: aggiungere JWT e ruoli (Admin, Dipendente) come descritto nel progetto originale.  
* **Integrare N8N e Google Calendar**: configurare le OAuth e le automazioni tramite webhook.
* **Ottimizzare l'interfaccia**: sviluppare i componenti React per il chatbot, l'editor di codice, la generazione di documenti, il calendario integrato e la dashboard utente.

Per qualsiasi domanda o necessità di supporto nel proseguimento dello sviluppo, puoi estendere o modificare la struttura seguendo le linee guida di questo repository.
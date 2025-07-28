import { Request, Response } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const exportProject = async (req: Request, res: Response) => {
  try {
    console.log('🚀 Iniziando esportazione completa del progetto...');

    // 1. Crea il file .env con le variabili d'ambiente
    await createEnvFile();

    // 2. Esporta il database PostgreSQL
    await exportDatabase();

    // 3. Crea l'archivio ZIP con tutto il progetto
    const zipPath = await createProjectZip();

    // 4. Invia il file ZIP come download con header specifici
    const filename = 'nuvia-project-export.zip';
    const stats = fs.statSync(zipPath);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Stream del file
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      console.log('✅ Esportazione completata con successo!');
      // Cleanup del file temporaneo dopo il download
      setTimeout(() => {
        try {
          fs.unlinkSync(zipPath);
        } catch (e) {
          console.log('File temporaneo già rimosso');
        }
      }, 60000); // Rimuovi dopo 1 minuto
    });
    
    fileStream.on('error', (err) => {
      console.error('Errore durante il streaming:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Errore durante il download del file' });
      }
    });

  } catch (error) {
    console.error('❌ Errore durante l\'esportazione:', error);
    res.status(500).json({ 
      error: 'Errore durante l\'esportazione del progetto',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
};

async function createEnvFile(): Promise<void> {
  console.log('📝 Creando file .env con variabili d\'ambiente...');
  
  const envVars = [
    'DATABASE_URL',
    'GOOGLE_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'GOOGLE_SEARCH_ENGINE_ID',
    'NUVIA_APP_PASSWORD',
    'PGDATABASE',
    'PGHOST',
    'PGPASSWORD',
    'PGPORT',
    'PGUSER',
    'SESSION_SECRET',
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'PERPLEXITY_API_KEY',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_PROJECT_ID',
    'NODE_ENV',
    'PORT'
  ];

  let envContent = '# Nuvia Project Environment Variables\n';
  envContent += '# Generated on ' + new Date().toISOString() + '\n\n';

  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      envContent += `${varName}=${value}\n`;
    } else {
      envContent += `# ${varName}=<inserire_valore_qui>\n`;
    }
  }

  // Aggiungi commenti utili
  envContent += '\n# Note per la migrazione:\n';
  envContent += '# - Sostituire DATABASE_URL con il nuovo database PostgreSQL\n';
  envContent += '# - Verificare che tutte le API key siano valide\n';
  envContent += '# - NODE_ENV=production per il deployment\n';
  envContent += '# - PORT=3000 o la porta desiderata per il server\n';

  fs.writeFileSync('.env.export', envContent);
  console.log('✅ File .env creato con successo');
}

async function exportDatabase(): Promise<void> {
  console.log('💾 Esportando database PostgreSQL...');
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL non trovato nelle variabili d\'ambiente');
    }

    // Parse dell'URL del database
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1); // Rimuovi il '/' iniziale
    const username = url.username;
    const password = url.password;

    // Comando pg_dump per esportare il database
    const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --clean --if-exists --verbose`;
    
    console.log('🔄 Eseguendo pg_dump...');
    const { stdout, stderr } = await execAsync(dumpCommand);
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️ Warning durante pg_dump:', stderr);
    }

    // Salva il dump in un file
    fs.writeFileSync('database_backup.sql', stdout);
    
    // Crea anche un file con le istruzioni di ripristino
    const restoreInstructions = `# Istruzioni per ripristinare il database Nuvia

## Prerequisiti
- PostgreSQL 12 o superiore installato
- Accesso a un database PostgreSQL (locale o cloud)

## Passi per il ripristino

1. Crea un nuovo database:
   \`\`\`sql
   CREATE DATABASE nuvia_db;
   \`\`\`

2. Ripristina i dati dal backup:
   \`\`\`bash
   psql -h <host> -p <port> -U <username> -d nuvia_db < database_backup.sql
   \`\`\`

3. Aggiorna il file .env con la nuova DATABASE_URL:
   \`\`\`
   DATABASE_URL=postgresql://username:password@host:port/nuvia_db
   \`\`\`

## Note
- Il backup include schema completo e tutti i dati
- Le tabelle vengono ricreate automaticamente
- Tutti gli utenti, progetti, eventi e conversazioni sono inclusi

Data backup: ${new Date().toISOString()}
`;

    fs.writeFileSync('DATABASE_RESTORE_INSTRUCTIONS.md', restoreInstructions);
    console.log('✅ Database esportato con successo');
    
  } catch (error) {
    console.error('❌ Errore durante l\'esportazione del database:', error);
    
    // Crea un file di fallback con le istruzioni manuali
    const fallbackInstructions = `# ERRORE: Impossibile esportare automaticamente il database

Esporta manualmente il database con questi comandi:

1. Connettiti al database Replit via terminale
2. Esegui il comando:
   \`\`\`bash
   pg_dump $DATABASE_URL > database_backup.sql
   \`\`\`

Oppure usa l'interfaccia web di Replit:
1. Vai alla sezione Database
2. Clicca su "Export" o "Download"
3. Salva il file come database_backup.sql

Errore riscontrato: ${error instanceof Error ? error.message : 'Errore sconosciuto'}
Data tentativo: ${new Date().toISOString()}
`;
    
    fs.writeFileSync('DATABASE_EXPORT_ERROR.md', fallbackInstructions);
  }
}

async function createProjectZip(): Promise<string> {
  console.log('📦 Creando archivio ZIP del progetto...');
  
  const zipPath = path.join(process.cwd(), 'nuvia-project-export.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Archivio creato: ${archive.pointer()} bytes totali`);
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // File e cartelle da includere
    const filesToInclude = [
      // File di configurazione
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
      'components.json',
      'drizzle.config.ts',
      '.replit',
      '.gitignore',
      'replit.md',
      
      // File di export creati
      '.env.export',
      'database_backup.sql',
      'DATABASE_RESTORE_INSTRUCTIONS.md',
      
      // Cartelle del progetto
      'client/',
      'server/',
      'shared/',
      'prisma/',
      'scripts/',
      'uploads/',
      'logs/'
    ];

    // Aggiungi tutti i file specificati
    for (const file of filesToInclude) {
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          archive.directory(filePath, file);
          console.log(`📁 Aggiunta cartella: ${file}`);
        } else {
          archive.file(filePath, { name: file });
          console.log(`📄 Aggiunto file: ${file}`);
        }
      } else {
        console.log(`⚠️ File non trovato: ${file}`);
      }
    }

    // Aggiungi file di errore del database se esiste
    const errorFile = path.join(process.cwd(), 'DATABASE_EXPORT_ERROR.md');
    if (fs.existsSync(errorFile)) {
      archive.file(errorFile, { name: 'DATABASE_EXPORT_ERROR.md' });
    }

    // Crea un README per la migrazione
    const migrationReadme = `# Nuvia AI Agent - Guida alla Migrazione

## Contenuto dell'archivio

Questo archivio contiene tutto il necessario per migrare il progetto Nuvia:

### 📁 Struttura del progetto
- \`client/\` - Frontend React con TypeScript
- \`server/\` - Backend Express con TypeScript  
- \`shared/\` - Codice condiviso (schemi, tipi)
- \`prisma/\` - Configurazione database ORM
- \`uploads/\` - File caricati dagli utenti
- \`logs/\` - File di log dell'applicazione

### ⚙️ File di configurazione
- \`package.json\` - Dipendenze Node.js
- \`tsconfig.json\` - Configurazione TypeScript
- \`vite.config.ts\` - Configurazione build frontend
- \`tailwind.config.ts\` - Configurazione CSS
- \`.env.export\` - **Variabili d'ambiente (IMPORTANTE)**

### 💾 Database
- \`database_backup.sql\` - Dump completo PostgreSQL
- \`DATABASE_RESTORE_INSTRUCTIONS.md\` - Istruzioni ripristino

## 🚀 Passi per la migrazione

### 1. Preparazione ambiente
\`\`\`bash
# Clona il progetto da questo archivio
unzip nuvia-project-export.zip
cd nuvia-project-export

# Installa Node.js 18+ e PostgreSQL 12+
npm install
\`\`\`

### 2. Configurazione database
\`\`\`bash
# Crea nuovo database PostgreSQL
createdb nuvia_db

# Ripristina i dati
psql nuvia_db < database_backup.sql
\`\`\`

### 3. Variabili d'ambiente
\`\`\`bash
# Rinomina e configura il file .env
mv .env.export .env

# Modifica .env con i tuoi valori:
# - DATABASE_URL del nuovo database
# - API keys (Google, OpenAI, ecc.)
# - Domini e segreti per il deployment
\`\`\`

### 4. Avvio applicazione
\`\`\`bash
# Sviluppo
npm run dev

# Produzione
npm run build
npm start
\`\`\`

## 🔑 Servizi esterni richiesti

Per il funzionamento completo, configura:

1. **Database PostgreSQL** - Per dati persistenti
2. **Google AI (Gemini)** - Per l'intelligenza artificiale
3. **Gmail SMTP** - Per promemoria email
4. **Google OAuth** - Per autenticazione (opzionale)
5. **OpenAI API** - Backup AI provider (opzionale)

## 📞 Supporto

Per domande sulla migrazione, contatta il team di sviluppo.

Data esportazione: ${new Date().toISOString()}
Versione: Nuvia AI Agent v1.0
`;

    archive.append(migrationReadme, { name: 'README_MIGRAZIONE.md' });

    archive.finalize();
  });
}
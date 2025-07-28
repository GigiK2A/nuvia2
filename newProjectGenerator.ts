// 🧠 Simulazione generazione progetto completo in base al tipo

export async function simulateProjectGeneration(prompt: string, type: string): Promise<{
  name: string;
  files: Record<string, string>;
}> {
  const baseName = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '-')
    .slice(0, 30);

  const name = `${type}-${baseName}`;

  let files: Record<string, string> = {};

  switch (type) {
    case 'landing-page':
      files = {
        'index.html': `<html><head><title>Landing Page</title></head><body><h1>${prompt}</h1></body></html>`,
        'style.css': `body { font-family: sans-serif; text-align: center; }`,
        'script.js': `console.log("Landing page loaded.");`,
      };
      break;

    case 'react-app':
      files = {
        'src/App.jsx': `export default function App() { return <h1>${prompt}</h1>; }`,
        'src/index.js': `import React from "react"; import ReactDOM from "react-dom/client"; import App from "./App"; const root = ReactDOM.createRoot(document.getElementById("root")); root.render(<App />);`,
        'public/index.html': `<html><body><div id="root"></div></body></html>`,
        'package.json': `{ "name": "${name}", "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" } }`
      };
      break;

    case 'node-agent':
      files = {
        'index.js': `console.log("🧠 Nuvia Agent: ${prompt}")`,
        'package.json': `{ "name": "${name}", "type": "module" }`
      };
      break;

    case 'api-backend':
      files = {
        'server.js': `const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotte API per: ${prompt}
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: "API Backend attivo!",
    description: "${prompt}",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: "online",
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Esempio CRUD - Users
let users = [
  { id: 1, name: "Mario Rossi", email: "mario@email.com" },
  { id: 2, name: "Lucia Bianchi", email: "lucia@email.com" }
];

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const newUser = {
    id: users.length + 1,
    name: req.body.name,
    email: req.body.email
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });
  res.json(user);
});

// Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 API Server running on port \${PORT}\`);
  console.log(\`📖 API Documentation:\`);
  console.log(\`   GET  /api/hello - Saluto di benvenuto\`);
  console.log(\`   GET  /api/status - Stato del server\`);
  console.log(\`   GET  /api/users - Lista utenti\`);
  console.log(\`   POST /api/users - Crea nuovo utente\`);
  console.log(\`   GET  /api/users/:id - Dettagli utente\`);
});`,
        'package.json': JSON.stringify({
          name: name,
          version: "1.0.0",
          description: `API Backend per: ${prompt}`,
          main: "server.js",
          scripts: {
            start: "node server.js",
            dev: "nodemon server.js"
          },
          dependencies: {
            express: "^4.18.2",
            cors: "^2.8.5"
          },
          devDependencies: {
            nodemon: "^2.0.22"
          },
          keywords: ["api", "backend", "express", "rest"]
        }, null, 2),
        'README.md': `# ${name}

API Backend generato per: **${prompt}**

## 🚀 Avvio Rapido

\`\`\`bash
npm install
npm start
\`\`\`

## 📋 API Endpoints

- **GET** \`/api/hello\` - Saluto di benvenuto
- **GET** \`/api/status\` - Stato del server
- **GET** \`/api/users\` - Lista tutti gli utenti
- **POST** \`/api/users\` - Crea nuovo utente
- **GET** \`/api/users/:id\` - Dettagli di un utente

## 📝 Esempi di Utilizzo

### Ottenere tutti gli utenti
\`\`\`bash
curl http://localhost:3000/api/users
\`\`\`

### Creare un nuovo utente
\`\`\`bash
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Nuovo Utente","email":"nuovo@email.com"}'
\`\`\`

## 🛠️ Sviluppo

Per sviluppo con auto-reload:
\`\`\`bash
npm run dev
\`\`\`

---
*Generato automaticamente da Nuvia AI*`,
        '.gitignore': `node_modules/
.env
*.log
.DS_Store
dist/
build/`
      };
      break;

    case 'db-schema':
      files = {
        'schema.sql': `-- Schema Database per: ${prompt}
-- Generato automaticamente da Nuvia AI

CREATE DATABASE IF NOT EXISTS app_database;
USE app_database;

-- Tabella utenti
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'moderator') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabella profili utente
CREATE TABLE user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabella categorie
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella principale per: ${prompt}
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT,
  user_id INT NOT NULL,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  tags JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

-- Tabella log attività
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_action (user_id, action),
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_created (created_at)
);`,
        'seed.sql': `-- Dati di esempio per: ${prompt}
-- Da eseguire dopo schema.sql

-- Inserimento categorie
INSERT INTO categories (name, description, slug) VALUES
('Generale', 'Categoria generale per elementi vari', 'generale'),
('Importante', 'Elementi ad alta priorità', 'importante'),
('Archivio', 'Elementi archiviati', 'archivio'),
('Progetti', 'Gestione progetti', 'progetti');

-- Inserimento utenti di esempio
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@example.com', '$2a$10$example_hash_admin', 'admin'),
('Mario Rossi', 'mario.rossi@email.com', '$2a$10$example_hash_mario', 'user'),
('Lucia Bianchi', 'lucia.bianchi@email.com', '$2a$10$example_hash_lucia', 'user'),
('Marco Verdi', 'marco.verdi@email.com', '$2a$10$example_hash_marco', 'moderator');

-- Inserimento profili utente
INSERT INTO user_profiles (user_id, bio, phone, address) VALUES
(1, 'Amministratore del sistema', '+39 123 456 7890', 'Via Roma 1, Milano'),
(2, 'Sviluppatore frontend', '+39 234 567 8901', 'Via Venezia 10, Roma'),
(3, 'Designer UX/UI', '+39 345 678 9012', 'Via Firenze 5, Napoli'),
(4, 'Project Manager', '+39 456 789 0123', 'Via Torino 8, Bologna');

-- Inserimento elementi di esempio
INSERT INTO items (title, description, category_id, user_id, status, priority, tags) VALUES
('Primo Elemento', 'Descrizione del primo elemento per ${prompt}', 1, 2, 'published', 'high', '["importante", "nuovo"]'),
('Secondo Elemento', 'Elemento in bozza', 2, 3, 'draft', 'medium', '["bozza", "in-sviluppo"]'),
('Elemento Archiviato', 'Questo elemento è stato archiviato', 3, 2, 'archived', 'low', '["vecchio", "completato"]'),
('Progetto Speciale', 'Un progetto importante', 4, 1, 'published', 'high', '["progetto", "prioritario"]');

-- Log di esempio
INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES
(1, 'CREATE', 'items', 1, '{"title":"Primo Elemento","status":"published"}', '192.168.1.1'),
(2, 'CREATE', 'items', 2, '{"title":"Secondo Elemento","status":"draft"}', '192.168.1.2'),
(3, 'UPDATE', 'items', 1, '{"priority":"high"}', '192.168.1.3');`,
        'README.md': `# ${name} - Database Schema

Schema database generato per: **${prompt}**

## 📋 Struttura Database

### Tabelle Principali

- **users** - Gestione utenti del sistema
- **user_profiles** - Profili estesi degli utenti  
- **categories** - Categorizzazione degli elementi
- **items** - Tabella principale per ${prompt}
- **activity_logs** - Log delle attività sistema

### 🚀 Setup Database

1. **Crea il database:**
\`\`\`sql
mysql -u root -p < schema.sql
\`\`\`

2. **Inserisci dati di esempio:**
\`\`\`sql
mysql -u root -p app_database < seed.sql
\`\`\`

### 📊 Query di Esempio

#### Ottenere tutti gli elementi attivi con categoria
\`\`\`sql
SELECT i.*, c.name as category_name, u.name as user_name
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN users u ON i.user_id = u.id
WHERE i.status = 'published'
ORDER BY i.created_at DESC;
\`\`\`

#### Conteggio elementi per categoria
\`\`\`sql
SELECT c.name, COUNT(i.id) as item_count
FROM categories c
LEFT JOIN items i ON c.id = i.category_id
GROUP BY c.id, c.name;
\`\`\`

#### Log attività recenti
\`\`\`sql
SELECT al.*, u.name as user_name
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 10;
\`\`\`

### 🔧 Indici e Performance

- Indici ottimizzati per query frequenti
- Chiavi esterne per integrità referenziale
- Timestamp automatici per audit trail
- Supporto JSON per metadati flessibili

### 📝 Note

- Le password sono hashate con bcrypt
- Supporto per soft delete tramite \`is_active\`
- Log completo delle attività utente
- Schema progettato per scalabilità

---
*Generato automaticamente da Nuvia AI*`,
        'migrations.sql': `-- File di migrazione per aggiornamenti futuri
-- ${name}

-- Esempio: Aggiungere nuova colonna
-- ALTER TABLE items ADD COLUMN featured BOOLEAN DEFAULT FALSE;

-- Esempio: Creare nuova tabella
-- CREATE TABLE item_comments (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   item_id INT NOT NULL,
--   user_id INT NOT NULL,
--   comment TEXT NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- Placeholder per future migrazioni
SELECT 'Nessuna migrazione da eseguire al momento' as status;`,
        'queries.sql': `-- Query utili per ${name}
-- Collezione di query frequentemente utilizzate

-- 1. Statistiche generali
SELECT 
  (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as active_users,
  (SELECT COUNT(*) FROM items WHERE status = 'published') as published_items,
  (SELECT COUNT(*) FROM categories) as total_categories;

-- 2. Top utenti per numero di elementi
SELECT 
  u.name,
  u.email,
  COUNT(i.id) as item_count
FROM users u
LEFT JOIN items i ON u.id = i.user_id
GROUP BY u.id, u.name, u.email
ORDER BY item_count DESC
LIMIT 10;

-- 3. Elementi recenti con dettagli completi
SELECT 
  i.id,
  i.title,
  i.status,
  i.priority,
  c.name as category,
  u.name as author,
  i.created_at
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN users u ON i.user_id = u.id
ORDER BY i.created_at DESC
LIMIT 20;

-- 4. Attività per data
SELECT 
  DATE(created_at) as date,
  COUNT(*) as activity_count
FROM activity_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5. Pulizia dati vecchi (ATTENZIONE: eseguire con cautela)
-- DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);`
      };
      break;

    case 'deploy-config':
      files = {
        'vercel.json': JSON.stringify({
          version: 2,
          builds: [
            { src: "*.html", use: "@vercel/static" },
            { src: "api/**/*.js", use: "@vercel/node" }
          ],
          routes: [
            { src: "/api/(.*)", dest: "/api/$1" },
            { src: "/(.*)", dest: "/$1" }
          ],
          functions: {
            "api/**/*.js": {
              runtime: "nodejs18.x"
            }
          }
        }, null, 2),
        'render.yaml': `services:
  - type: web
    name: ${name}
    env: node
    buildCommand: "npm install && npm run build"
    startCommand: "npm start"
    plan: free
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /health`,
        'Procfile': `web: npm start
release: npm run migrate`,
        'netlify.toml': `[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`,
        'docker-compose.yml': `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ${name.replace(/-/g, '_')}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,
        'Dockerfile': `FROM node:18-alpine

WORKDIR /app

# Copia file di dipendenze
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia codice sorgente
COPY . .

# Esponi porta
EXPOSE 3000

# Crea utente non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

# Comando di avvio
CMD ["npm", "start"]`,
        'railway.json': JSON.stringify({
          "$schema": "https://railway.app/railway.schema.json",
          "build": {
            "builder": "NIXPACKS"
          },
          "deploy": {
            "startCommand": "npm start",
            "healthcheckPath": "/health",
            "healthcheckTimeout": 100,
            "restartPolicyType": "ON_FAILURE",
            "restartPolicyMaxRetries": 10
          }
        }, null, 2),
        'fly.toml': `app = "${name}"
primary_region = "fra"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256`,
        'README.md': `# ${name} - Configurazioni Deploy

Configurazioni di deployment per: **${prompt}**

## 🚀 Piattaforme Supportate

### Vercel
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

### Render
1. Connetti il repository su [render.com](https://render.com)
2. Il file \`render.yaml\` verrà automaticamente rilevato

### Netlify
\`\`\`bash
npm install -g netlify-cli
netlify deploy --prod
\`\`\`

### Railway
\`\`\`bash
npm install -g @railway/cli
railway login
railway deploy
\`\`\`

### Fly.io
\`\`\`bash
curl -L https://fly.io/install.sh | sh
fly deploy
\`\`\`

### Docker
\`\`\`bash
docker build -t ${name} .
docker run -p 3000:3000 ${name}
\`\`\`

### Docker Compose (con database)
\`\`\`bash
docker-compose up -d
\`\`\`

## 📋 Variabili d'Ambiente

Assicurati di configurare queste variabili nella tua piattaforma:

\`\`\`env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
\`\`\`

## 🔧 Scripts NPM Richiesti

Aggiungi questi script al tuo \`package.json\`:

\`\`\`json
{
  "scripts": {
    "start": "node server.js",
    "build": "npm install",
    "dev": "nodemon server.js",
    "migrate": "node migrations.js"
  }
}
\`\`\`

## 🌐 Domini Personalizzati

### Vercel
\`\`\`bash
vercel domains add yourdomain.com
\`\`\`

### Netlify
\`\`\`bash
netlify domains:create yourdomain.com
\`\`\`

## 🔒 HTTPS e SSL

Tutte le piattaforme forniscono automaticamente:
- Certificati SSL gratuiti
- Redirect automatico HTTPS
- CDN globale

## 📊 Monitoraggio

- **Uptime**: Integrato nelle piattaforme
- **Logs**: Accessibili via dashboard
- **Metriche**: CPU, memoria, traffico

---
*Configurazioni generate da Nuvia AI*`,
        '.github/workflows/deploy.yml': `name: Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.ORG_ID }}
        vercel-project-id: \${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'`
      };
      break;

    default:
      files = {
        'index.txt': `Tipo progetto non supportato: ${type}`
      };
  }

  return { name, files };
}
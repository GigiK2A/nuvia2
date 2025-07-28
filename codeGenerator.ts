/**
 * Servizio per la generazione di codice utilizzando l'AI
 */
import { generateAIResponse } from './utils/aiClient';

/**
 * Inizializza OpenAI con la chiave API, se disponibile
 */
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

/**
 * Genera codice utilizzando OpenAI o simulazione
 */
export async function generateCode(language: string, description: string): Promise<{
  code: string;
  openai: boolean;
}> {
  try {
    if (openai) {
      const code = await generateWithOpenAI(language, description);
      return { code, openai: true };
    } else {
      const code = simulateCodeGeneration(language, description);
      return { code, openai: false };
    }
  } catch (error) {
    console.error('Errore nella generazione di codice:', error);
    // Fallback alla simulazione in caso di errore con OpenAI
    const code = simulateCodeGeneration(language, description);
    return { code, openai: false };
  }
}

/**
 * Genera codice utilizzando OpenAI 
 */
async function generateWithOpenAI(language: string, description: string): Promise<string> {
  if (!openai) {
    throw new Error('API Key OpenAI non configurata.');
  }

  // Crea un prompt per l'AI per generare codice specifico
  const systemPrompt = `Agisci come un esperto sviluppatore. Genera codice ${language} completo, 
  pulito e funzionante secondo la seguente richiesta. 
  Includi commenti esplicativi per le parti principali del codice.
  Se appropriato, organizza il codice in funzioni ben definite e moduli.
  Non includere spiegazioni extra all'inizio o alla fine, solo il codice pronto all'uso.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // il modello più recente di OpenAI
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
      temperature: 0.4, // Valore più basso per codice più deterministico
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Errore nella generazione di codice con OpenAI:', error);
    throw new Error('Impossibile generare il codice con OpenAI.');
  }
}

/**
 * Simula la generazione di codice quando OpenAI non è disponibile
 */
function simulateCodeGeneration(language: string, description: string): string {
  const lowercaseDescription = description.toLowerCase();
  
  // Casi di esempio basati sulla richiesta
  if (language === 'html' && lowercaseDescription.includes('form')) {
    return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form di Contatto</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <h1>Contattaci</h1>
  <form id="contactForm">
    <div class="form-group">
      <label for="name">Nome</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
      <label for="message">Messaggio</label>
      <textarea id="message" name="message" rows="5" required></textarea>
    </div>
    <button type="submit">Invia</button>
  </form>

  <script>
    // Gestione del form
    document.getElementById('contactForm').addEventListener('submit', function(e) {
      e.preventDefault();
      // Qui inserire la logica per inviare i dati del form
      alert('Grazie per il tuo messaggio! Ti risponderemo presto.');
      this.reset();
    });
  </script>
</body>
</html>`;
  } 
  
  else if (language === 'javascript' && (lowercaseDescription.includes('todo') || lowercaseDescription.includes('task'))) {
    return `// App per gestione task
class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.taskInput = document.getElementById('taskInput');
    this.taskList = document.getElementById('taskList');
    this.init();
  }

  init() {
    // Inizializza l'app
    this.renderTasks();
    document.getElementById('addTask').addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
  }

  addTask() {
    const taskText = this.taskInput.value.trim();
    if (taskText) {
      this.tasks.push({
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date()
      });
      this.taskInput.value = '';
      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveTasks();
    this.renderTasks();
  }

  toggleTaskStatus(id) {
    this.tasks = this.tasks.map(task => 
      task.id === id ? {...task, completed: !task.completed} : task
    );
    this.saveTasks();
    this.renderTasks();
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  renderTasks() {
    this.taskList.innerHTML = '';
    
    if (this.tasks.length === 0) {
      this.taskList.innerHTML = '<li class="empty-list">Nessun task da completare</li>';
      return;
    }
    
    this.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = task.completed ? 'task-item completed' : 'task-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => this.toggleTaskStatus(task.id));
      
      const span = document.createElement('span');
      span.textContent = task.text;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '❌';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
      
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      this.taskList.appendChild(li);
    });
  }
}

// Inizializza l'app quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});`;
  }
  
  else if (language === 'python' && lowercaseDescription.includes('file')) {
    return `# Script per l'elaborazione di file
import os
import csv
import json
from datetime import datetime

class FileProcessor:
    """Classe per l'elaborazione di file in diversi formati."""
    
    def __init__(self, directory='.'):
        """Inizializza il processore di file con una directory."""
        self.directory = directory
        self.supported_extensions = {
            '.txt': self.process_text,
            '.csv': self.process_csv,
            '.json': self.process_json
        }
        
    def scan_directory(self):
        """Scansiona la directory e restituisce i file supportati."""
        supported_files = []
        
        for filename in os.listdir(self.directory):
            file_path = os.path.join(self.directory, filename)
            if os.path.isfile(file_path):
                _, ext = os.path.splitext(filename)
                if ext.lower() in self.supported_extensions:
                    supported_files.append(file_path)
                    
        return supported_files
    
    def process_file(self, file_path):
        """Elabora un file in base alla sua estensione."""
        _, ext = os.path.splitext(file_path)
        
        if ext.lower() not in self.supported_extensions:
            raise ValueError(f"Formato file non supportato: {ext}")
            
        processor = self.supported_extensions[ext.lower()]
        return processor(file_path)
    
    def process_text(self, file_path):
        """Elabora un file di testo."""
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Analisi del file di testo
        lines = content.split('\\n')
        words = content.split()
        chars = len(content)
        
        return {
            'type': 'text',
            'filename': os.path.basename(file_path),
            'stats': {
                'lines': len(lines),
                'words': len(words),
                'characters': chars
            },
            'content': content[:500] + '...' if len(content) > 500 else content
        }
    
    def process_csv(self, file_path):
        """Elabora un file CSV."""
        rows = []
        
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            headers = next(reader)
            for row in reader:
                rows.append(row)
        
        return {
            'type': 'csv',
            'filename': os.path.basename(file_path),
            'stats': {
                'rows': len(rows),
                'columns': len(headers)
            },
            'headers': headers,
            'sample_data': rows[:5] if rows else []
        }
    
    def process_json(self, file_path):
        """Elabora un file JSON."""
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        # Analisi della struttura JSON
        if isinstance(data, list):
            structure = f"Lista di {len(data)} elementi"
            keys = list(data[0].keys()) if data and isinstance(data[0], dict) else []
        elif isinstance(data, dict):
            structure = "Oggetto con chiavi: " + ", ".join(data.keys())
            keys = list(data.keys())
        else:
            structure = f"Valore di tipo {type(data).__name__}"
            keys = []
            
        return {
            'type': 'json',
            'filename': os.path.basename(file_path),
            'stats': {
                'structure': structure,
                'keys': keys
            },
            'sample': json.dumps(data, indent=2)[:500] + '...' if len(json.dumps(data)) > 500 else json.dumps(data, indent=2)
        }`;
  }
  
  else if (language === 'react' || (language === 'javascript' && lowercaseDescription.includes('react'))) {
    return `// Componente React per una Dashboard 
import { useState, useEffect } from 'react';
import './Dashboard.css';

// Componente Card per visualizzare informazioni sintetiche
function MetricCard({ title, value, icon, trend }) {
  const trendClass = trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : '';
  
  return (
    <div className="metric-card">
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3>{title}</h3>
        <p className="card-value">{value}</p>
        {trend !== undefined && (
          <p className="card-trend {trendClass}">
            {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}
            {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}

// Componente per visualizzare dati in tabella
function DataTable({ data, columns }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td key={column.key}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente principale Dashboard
export default function Dashboard() {
  const [metrics, setMetrics] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulazione di caricamento dati
    setTimeout(() => {
      // Dati di esempio
      setMetrics([
        { id: 1, title: 'Vendite', value: '€4,294', icon: '💰', trend: 12 },
        { id: 2, title: 'Utenti', value: '1,893', icon: '👥', trend: 8 },
        { id: 3, title: 'Conversioni', value: '24%', icon: '📈', trend: -3 },
        { id: 4, title: 'Costi', value: '€1,530', icon: '💸', trend: 2 }
      ]);
      
      setRecentActivity([
        { id: 1, action: 'Nuovo ordine', user: 'Mario Rossi', timestamp: '10:45', status: 'Completato' },
        { id: 2, action: 'Registrazione', user: 'Anna Verdi', timestamp: '09:32', status: 'Attivo' },
        { id: 3, action: 'Supporto', user: 'Luca Bianchi', timestamp: '08:15', status: 'In attesa' },
        { id: 4, action: 'Pagamento', user: 'Sofia Neri', timestamp: 'Ieri', status: 'Fallito' },
        { id: 5, action: 'Nuovo ordine', user: 'Giovanni Blu', timestamp: 'Ieri', status: 'Spedito' }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);
  
  // Definizione colonne per la tabella di attività recenti
  const activityColumns = [
    { key: 'action', label: 'Attività' },
    { key: 'user', label: 'Utente' },
    { key: 'timestamp', label: 'Orario' },
    { key: 'status', label: 'Stato' }
  ];
  
  if (loading) {
    return <div className="loading">Caricamento dashboard...</div>;
  }
  
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="metrics-grid">
        {metrics.map(metric => (
          <MetricCard 
            key={metric.id}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
          />
        ))}
      </div>
      
      <div className="dashboard-section">
        <h2>Attività Recenti</h2>
        <DataTable 
          data={recentActivity}
          columns={activityColumns}
        />
      </div>
      
      <div className="dashboard-footer">
        <p>Ultimo aggiornamento: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}`;
  } 
  
  else {
    // Esempio generico per altri linguaggi
    return `// Codice ${language} generato per: ${description}
// Nota: questo è un esempio simulato
// In una versione reale utilizzeremmo OpenAI per generare codice specifico

/*
 * Descrizione: ${description}
 * Linguaggio: ${language}
 * Data: ${new Date().toLocaleDateString()}
 */

// Questo è solo un esempio di codice generato
// Per una generazione reale, configura una chiave API OpenAI nelle impostazioni

console.log("Implementazione da completare per: ${description}");`;
  }
}
function simulateCodeGeneration(language: string, description: string): string {
  const lowercaseDescription = description.toLowerCase();
  
  // Casi di esempio basati sulla richiesta
  if (language === 'html' && lowercaseDescription.includes('form')) {
    return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form di Contatto</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <h1>Contattaci</h1>
  <form id="contactForm">
    <div class="form-group">
      <label for="name">Nome</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
      <label for="message">Messaggio</label>
      <textarea id="message" name="message" rows="5" required></textarea>
    </div>
    <button type="submit">Invia</button>
  </form>

  <script>
    // Gestione del form
    document.getElementById('contactForm').addEventListener('submit', function(e) {
      e.preventDefault();
      // Qui inserire la logica per inviare i dati del form
      alert('Grazie per il tuo messaggio! Ti risponderemo presto.');
      this.reset();
    });
  </script>
</body>
</html>`;
  } 
  else if (language === 'javascript' && (lowercaseDescription.includes('todo') || lowercaseDescription.includes('task'))) {
    return `// App per gestione task
class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.taskInput = document.getElementById('taskInput');
    this.taskList = document.getElementById('taskList');
    this.init();
  }

  init() {
    // Inizializza l'app
    this.renderTasks();
    document.getElementById('addTask').addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
  }

  addTask() {
    const taskText = this.taskInput.value.trim();
    if (taskText) {
      this.tasks.push({
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date()
      });
      this.taskInput.value = '';
      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveTasks();
    this.renderTasks();
  }

  toggleTaskStatus(id) {
    this.tasks = this.tasks.map(task => 
      task.id === id ? {...task, completed: !task.completed} : task
    );
    this.saveTasks();
    this.renderTasks();
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  renderTasks() {
    this.taskList.innerHTML = '';
    
    if (this.tasks.length === 0) {
      this.taskList.innerHTML = '<li class="empty-list">Nessun task da completare</li>';
      return;
    }
    
    this.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = task.completed ? 'task-item completed' : 'task-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => this.toggleTaskStatus(task.id));
      
      const span = document.createElement('span');
      span.textContent = task.text;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '❌';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
      
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      this.taskList.appendChild(li);
    });
  }
}

// Inizializza l'app quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});

/* 
  CSS consigliato:
  .task-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  .task-item.completed span {
    text-decoration: line-through;
    color: #888;
  }
  .delete-btn {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
  }
  .empty-list {
    text-align: center;
    color: #888;
    font-style: italic;
  }
*/`;
  } 
  else if (language === 'python' && lowercaseDescription.includes('file')) {
    return `# Script per l'elaborazione di file
import os
import csv
import json
from datetime import datetime

class FileProcessor:
    """Classe per l'elaborazione di file in diversi formati."""
    
    def __init__(self, directory='.'):
        """Inizializza il processore di file con una directory."""
        self.directory = directory
        self.supported_extensions = {
            '.txt': self.process_text,
            '.csv': self.process_csv,
            '.json': self.process_json
        }
        
    def scan_directory(self):
        """Scansiona la directory e restituisce i file supportati."""
        supported_files = []
        
        for filename in os.listdir(self.directory):
            file_path = os.path.join(self.directory, filename)
            if os.path.isfile(file_path):
                _, ext = os.path.splitext(filename)
                if ext.lower() in self.supported_extensions:
                    supported_files.append(file_path)
                    
        return supported_files
    
    def process_file(self, file_path):
        """Elabora un file in base alla sua estensione."""
        _, ext = os.path.splitext(file_path)
        
        if ext.lower() not in self.supported_extensions:
            raise ValueError(f"Formato file non supportato: {ext}")
            
        processor = self.supported_extensions[ext.lower()]
        return processor(file_path)
    
    def process_text(self, file_path):
        """Elabora un file di testo."""
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Analisi del file di testo
        lines = content.split('\\n')
        words = content.split()
        chars = len(content)
        
        return {
            'type': 'text',
            'filename': os.path.basename(file_path),
            'stats': {
                'lines': len(lines),
                'words': len(words),
                'characters': chars
            },
            'content': content[:500] + '...' if len(content) > 500 else content
        }
    
    def process_csv(self, file_path):
        """Elabora un file CSV."""
        rows = []
        
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            headers = next(reader)
            for row in reader:
                rows.append(row)
        
        return {
            'type': 'csv',
            'filename': os.path.basename(file_path),
            'stats': {
                'rows': len(rows),
                'columns': len(headers)
            },
            'headers': headers,
            'sample_data': rows[:5] if rows else []
        }
    
    def process_json(self, file_path):
        """Elabora un file JSON."""
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        # Analisi della struttura JSON
        if isinstance(data, list):
            structure = f"Lista di {len(data)} elementi"
            keys = list(data[0].keys()) if data and isinstance(data[0], dict) else []
        elif isinstance(data, dict):
            structure = "Oggetto con chiavi: " + ", ".join(data.keys())
            keys = list(data.keys())
        else:
            structure = f"Valore di tipo {type(data).__name__}"
            keys = []
            
        return {
            'type': 'json',
            'filename': os.path.basename(file_path),
            'stats': {
                'structure': structure,
                'keys': keys
            },
            'sample': json.dumps(data, indent=2)[:500] + '...' if len(json.dumps(data)) > 500 else json.dumps(data, indent=2)
        }

# Esempio di utilizzo
if __name__ == "__main__":
    processor = FileProcessor()
    supported_files = processor.scan_directory()
    
    print(f"Trovati {len(supported_files)} file supportati:")
    
    for file_path in supported_files:
        print(f"\\nElaborazione: {os.path.basename(file_path)}")
        try:
            result = processor.process_file(file_path)
            print(f"Tipo: {result['type']}")
            print(f"Statistiche: {result['stats']}")
        except Exception as e:
            print(f"Errore nell'elaborazione: {e}")
`;
  } 
  else if (language === 'react' || (language === 'javascript' && lowercaseDescription.includes('react'))) {
    return `// Componente React per una Dashboard 
import { useState, useEffect } from 'react';
import './Dashboard.css';

// Componente Card per visualizzare informazioni sintetiche
function MetricCard({ title, value, icon, trend }) {
  const trendClass = trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : '';
  
  return (
    <div className="metric-card">
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3>{title}</h3>
        <p className="card-value">{value}</p>
        {trend !== undefined && (
          <p className={\`card-trend \${trendClass}\`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}
            {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}

// Componente per visualizzare dati in tabella
function DataTable({ data, columns }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td key={column.key}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente principale Dashboard
export default function Dashboard() {
  const [metrics, setMetrics] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulazione di caricamento dati
    setTimeout(() => {
      // Dati di esempio
      setMetrics([
        { id: 1, title: 'Vendite', value: '€4,294', icon: '💰', trend: 12 },
        { id: 2, title: 'Utenti', value: '1,893', icon: '👥', trend: 8 },
        { id: 3, title: 'Conversioni', value: '24%', icon: '📈', trend: -3 },
        { id: 4, title: 'Costi', value: '€1,530', icon: '💸', trend: 2 }
      ]);
      
      setRecentActivity([
        { id: 1, action: 'Nuovo ordine', user: 'Mario Rossi', timestamp: '10:45', status: 'Completato' },
        { id: 2, action: 'Registrazione', user: 'Anna Verdi', timestamp: '09:32', status: 'Attivo' },
        { id: 3, action: 'Supporto', user: 'Luca Bianchi', timestamp: '08:15', status: 'In attesa' },
        { id: 4, action: 'Pagamento', user: 'Sofia Neri', timestamp: 'Ieri', status: 'Fallito' },
        { id: 5, action: 'Nuovo ordine', user: 'Giovanni Blu', timestamp: 'Ieri', status: 'Spedito' }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);
  
  // Definizione colonne per la tabella di attività recenti
  const activityColumns = [
    { key: 'action', label: 'Attività' },
    { key: 'user', label: 'Utente' },
    { key: 'timestamp', label: 'Orario' },
    { key: 'status', label: 'Stato' }
  ];
  
  if (loading) {
    return <div className="loading">Caricamento dashboard...</div>;
  }
  
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="metrics-grid">
        {metrics.map(metric => (
          <MetricCard 
            key={metric.id}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
          />
        ))}
      </div>
      
      <div className="dashboard-section">
        <h2>Attività Recenti</h2>
        <DataTable 
          data={recentActivity}
          columns={activityColumns}
        />
      </div>
      
      <div className="dashboard-footer">
        <p>Ultimo aggiornamento: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

/* 
CSS consigliato:

.dashboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-title {
  margin-bottom: 24px;
  color: #333;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
}

.card-icon {
  font-size: 24px;
  margin-right: 16px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  margin: 8px 0;
}

.card-trend {
  font-size: 14px;
  font-weight: 500;
}

.trend-up {
  color: #4CAF50;
}

.trend-down {
  color: #F44336;
}

.dashboard-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f9f9f9;
  font-weight: 600;
}

.dashboard-footer {
  color: #666;
  font-size: 14px;
  text-align: right;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  font-size: 18px;
  color: #666;
}
*/`;
  } 
  else {
    // Esempio generico per altri linguaggi
    return `// Codice ${language} generato per: ${description}
// Nota: questo è un esempio simulato
// In una versione reale utilizzeremmo OpenAI per generare codice specifico

/*
 * Descrizione: ${description}
 * Linguaggio: ${language}
 * Data: ${new Date().toLocaleDateString()}
 */

// Questo è solo un esempio di codice generato
// Per una generazione reale, configura una chiave API OpenAI nelle impostazioni

console.log("Implementazione da completare per: ${description}");`;
  }
}

/**
 * Endpoint per la generazione di codice
 */
router.post('/generate-code', async (req, res) => {
  const { language, description } = req.body;

  if (!language || !description) {
    return res.status(400).json({ 
      error: 'Parametri mancanti',
      message: 'Linguaggio e descrizione sono obbligatori'
    });
  }

  try {
    // Tenta di generare il codice con OpenAI se disponibile
    let code = '';
    if (openai) {
      code = await generateWithOpenAI(language, description);
    } else {
      // Altrimenti usa la simulazione
      code = simulateCodeGeneration(language, description);
    }

    // Formatta la risposta
    return res.json({ 
      code, 
      language,
      generated: new Date().toISOString(),
      openai: !!openai
    });
  } catch (err: any) {
    console.error('Errore nella generazione del codice:', err);
    return res.status(500).json({ 
      error: 'Errore del servizio', 
      message: err.message || 'Si è verificato un errore durante la generazione del codice'
    });
  }
});

export default router;
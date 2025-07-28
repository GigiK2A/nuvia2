export function simulateAI(prompt: string) {
  return {
    success: true,
    files: {
      "index.html": `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Progetto simulato</title>
          <link rel="stylesheet" href="style.css" />
        </head>
        <body>
          <h1>Simulazione completata ✅</h1>
          <p>Prompt ricevuto: ${prompt}</p>
        </body>
        </html>
      `,
      "style.css": `
        body {
          font-family: Arial, sans-serif;
          background-color: #f8f8f8;
          color: #333;
          padding: 2rem;
        }
      `
    }
  };
}

// Funzione rimossa - ora utilizziamo simulateCodeAI.ts

function generateHTMLContent(prompt: string, projectName: string): string {
  if (prompt.toLowerCase().includes('fitness')) {
    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - La tua app fitness</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="hero">
        <nav>
            <div class="logo">💪 ${projectName}</div>
            <ul>
                <li><a href="#features">Funzioni</a></li>
                <li><a href="#pricing">Prezzi</a></li>
                <li><a href="#contact">Contatti</a></li>
            </ul>
        </nav>
        <div class="hero-content">
            <h1>Trasforma il tuo corpo con ${projectName}</h1>
            <p>L'app di fitness definitiva per raggiungere i tuoi obiettivi</p>
            <button class="cta-button" onclick="downloadApp()">Scarica Gratis</button>
        </div>
    </header>
    
    <section id="features" class="features">
        <h2>Perché scegliere ${projectName}?</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <h3>🏃‍♂️ Allenamenti Personalizzati</h3>
                <p>Piani di allenamento creati su misura per te</p>
            </div>
            <div class="feature-card">
                <h3>📊 Tracking Progressi</h3>
                <p>Monitora i tuoi risultati in tempo reale</p>
            </div>
            <div class="feature-card">
                <h3>🥗 Nutrizione Guidata</h3>
                <p>Consigli nutrizionali per ottimizzare i risultati</p>
            </div>
        </div>
    </section>

    <footer>
        <p>&copy; 2024 ${projectName}. Tutti i diritti riservati.</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
  }
  
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Benvenuto in ${projectName}</h1>
        <p>Progetto generato da: ${prompt}</p>
    </header>
    
    <main>
        <section class="content">
            <h2>Il tuo progetto è pronto!</h2>
            <p>Questo è un esempio di codice generato automaticamente.</p>
            <button onclick="showAlert()">Clicca qui</button>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 ${projectName}</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
}

function generateCSSContent(prompt: string): string {
  if (prompt.toLowerCase().includes('fitness')) {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
}

nav ul {
    display: flex;
    list-style: none;
    gap: 2rem;
}

nav a {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s;
}

nav a:hover {
    opacity: 0.8;
}

.hero-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3);
}

.features {
    padding: 4rem 2rem;
    background: #f8f9fa;
}

.features h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-card h3 {
    margin-bottom: 1rem;
    color: #667eea;
}

footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem;
}

@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2rem;
    }
    
    nav ul {
        flex-direction: column;
        gap: 1rem;
    }
}`;
  }
  
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f4f4f4;
}

header {
    background: linear-gradient(135deg, #74b9ff, #0984e3);
    color: white;
    text-align: center;
    padding: 4rem 2rem;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

header p {
    font-size: 1.2rem;
    opacity: 0.9;
}

main {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 2rem;
}

.content {
    background: white;
    padding: 3rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    text-align: center;
}

.content h2 {
    color: #0984e3;
    margin-bottom: 1rem;
}

.content p {
    margin-bottom: 2rem;
    font-size: 1.1rem;
}

button {
    background: #74b9ff;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1rem;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
}

button:hover {
    background: #0984e3;
}

footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem;
    margin-top: 3rem;
}

@media (max-width: 768px) {
    header h1 {
        font-size: 2rem;
    }
    
    .content {
        padding: 2rem;
    }
}`;
}

function generateJSContent(prompt: string): string {
  if (prompt.toLowerCase().includes('fitness')) {
    return `// Funzionalità app fitness
function downloadApp() {
    alert('Grazie! La tua app fitness sarà presto disponibile per il download.');
    
    // Simula tracking evento
    console.log('Download initiated for FitnessApp');
    
    // Animazione bottone
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
}

// Smooth scrolling per i link di navigazione
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animazione contatori (simulata)
    animateCounters();
});

function animateCounters() {
    // Simula contatori animati per statistiche fitness
    const stats = [
        { element: '.users-count', target: 10000 },
        { element: '.workouts-count', target: 50000 },
        { element: '.calories-count', target: 2000000 }
    ];
    
    stats.forEach(stat => {
        const element = document.querySelector(stat.element);
        if (element) {
            animateNumber(element, 0, stat.target, 2000);
        }
    });
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}`;
  }
  
  return `// JavaScript per il progetto generato
function showAlert() {
    alert('Ciao! Questo progetto è stato generato automaticamente.');
    console.log('Progetto funzionante correttamente!');
}

// Aggiungi un po' di interattività
document.addEventListener('DOMContentLoaded', function() {
    console.log('Progetto caricato con successo!');
    
    // Animazione fade-in per il contenuto
    const content = document.querySelector('.content');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
        content.style.transition = 'all 0.5s ease-in-out';
        
        setTimeout(() => {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // Aggiungi effetto hover ai bottoni
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});

// Funzione di utilità per log
function logAction(action) {
    console.log(\`Azione eseguita: \${action} - \${new Date().toLocaleTimeString()}\`);
}`;
}

// Simulate a delay to mimic API latency
const simulateDelay = async (min = 1000, max = 3000): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Generic responses for chat interactions
const genericResponses = [
  "Posso aiutarti a rispondere a qualsiasi domanda o risolvere problemi. Cosa ti serve sapere?",
  "Interessante domanda! Sto elaborando una risposta per te.",
  "Grazie per la tua richiesta. Cerco di fornirti le informazioni più accurate possibili.",
  "Questa è una simulazione di risposta AI. In un'implementazione reale, utilizzeremo l'API OpenAI per risposte più precise.",
  "Comprendo la tua richiesta. Posso aiutarti con molti argomenti diversi, dalle informazioni generali alla programmazione.",
];

// Responses about artificial intelligence
const aiResponses = [
  "Le intelligenze artificiali generative sono sistemi che creano contenuti originali analizzando pattern da grandi set di dati. Modelli come GPT-4, DALL-E e Stable Diffusion sono esempi prominenti.",
  "L'apprendimento automatico è un sottoinsieme dell'IA che utilizza algoritmi per imparare dai dati senza essere esplicitamente programmato. I modelli migliorano le loro prestazioni con l'esperienza.",
  "I modelli linguistici di grandi dimensioni (LLM) come GPT-4o utilizzano architetture transformer per elaborare e generare testo. Sono addestrati su enormi corpus testuali per comprendere e produrre linguaggio umano.",
  "L'etica dell'IA riguarda questioni come la privacy, il bias algoritmico, la trasparenza e l'impatto socioeconomico. È fondamentale sviluppare IA responsabili che rispettino i diritti umani.",
];

// Responses for document generation
const documentResponses = [
  "<h1>Documento di Esempio Generato</h1><p>Questo è un documento di esempio generato dall'assistente AI. In un'implementazione reale, il contenuto sarebbe creato in base alle tue specifiche richieste usando OpenAI.</p><h2>Caratteristiche</h2><ul><li>Contenuto personalizzato basato sulle tue esigenze</li><li>Formattazione professionale</li><li>Esportazione in diversi formati</li></ul><p>Questo documento può essere esportato in formato PDF o DOCX come richiesto.</p>",
  "<h1>Intelligenze Artificiali Generative: Un'Introduzione</h1><p>Le intelligenze artificiali generative rappresentano una classe di algoritmi di apprendimento automatico progettati per creare contenuti nuovi e originali.</p><h2>Applicazioni</h2><p>Questi modelli vengono utilizzati in diversi campi:</p><ul><li>Generazione di testo e conversazione</li><li>Creazione di immagini e design</li><li>Composizione musicale</li><li>Sviluppo di codice e supporto alla programmazione</li></ul><h2>Tecnologie</h2><p>I modelli generativi più diffusi includono:</p><ol><li>Transformer (GPT, LLaMA)</li><li>Diffusion Models (Stable Diffusion, DALL-E)</li><li>Variational Autoencoders (VAE)</li><li>Generative Adversarial Networks (GAN)</li></ol>",
  "<h1>Rapporto Tecnico: Sviluppo Software Agile</h1><p>Metodologia che enfatizza la collaborazione, l'adattabilità e la consegna incrementale di software funzionante.</p><h2>Principi Fondamentali</h2><ul><li>Soddisfare il cliente attraverso la consegna tempestiva di software di valore</li><li>Accogliere i cambiamenti nei requisiti, anche nelle fasi avanzate dello sviluppo</li><li>Consegnare frequentemente software funzionante</li><li>Collaborazione quotidiana tra sviluppatori e stakeholder</li></ul><h2>Framework Popolari</h2><ol><li>Scrum</li><li>Kanban</li><li>Extreme Programming (XP)</li><li>Lean Software Development</li></ol><p>L'adozione di pratiche agili ha dimostrato di migliorare la qualità del software e la soddisfazione del cliente.</p>"
];

// Code samples for code generation
const codeSamples = [
  `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Galleria Immagini Responsive</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      grid-gap: 15px;
    }
    .gallery-item {
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.3s;
    }
    .gallery-item:hover {
      transform: scale(1.03);
    }
    .gallery-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }
    .lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.9);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .lightbox.active {
      opacity: 1;
      pointer-events: auto;
    }
    .lightbox-content {
      max-width: 90%;
      max-height: 80%;
    }
    .lightbox-content img {
      width: 100%;
      height: auto;
      max-height: 80vh;
      object-fit: contain;
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 30px;
      color: white;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Galleria di Immagini</h1>
  <div class="gallery">
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1600096194534-95cf5ece04cf" alt="Mountains">
    </div>
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1542202229-7d93c33f5d07" alt="Ocean">
    </div>
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" alt="Beach">
    </div>
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6" alt="Sunset">
    </div>
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1447752875215-b2761acb3c5d" alt="Forest">
    </div>
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1470770903676-69b98201ea1c" alt="Waterfall">
    </div>
  </div>
  
  <div id="lightbox" class="lightbox">
    <span class="lightbox-close">&times;</span>
    <div class="lightbox-content">
      <img id="lightbox-img" src="" alt="Lightbox Image">
    </div>
  </div>
  
  <script>
    const gallery = document.querySelectorAll(".gallery-item img");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const close = document.querySelector(".lightbox-close");
    
    gallery.forEach(image => {
      image.addEventListener("click", () => {
        lightboxImg.src = image.src;
        lightbox.classList.add("active");
      });
    });
    
    close.addEventListener("click", () => {
      lightbox.classList.remove("active");
    });
    
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("active");
      }
    });
  </script>
</body>
</html>`,
  `import React, { useState } from 'react';
import './App.css';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div className="todo-app">
      <h1>Todo App</h1>
      <form onSubmit={addTodo}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aggiungi un task..."
        />
        <button type="submit">Aggiungi</button>
      </form>
      
      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          Tutti
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''} 
          onClick={() => setFilter('active')}
        >
          Attivi
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''} 
          onClick={() => setFilter('completed')}
        >
          Completati
        </button>
      </div>
      
      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Elimina</button>
          </li>
        ))}
      </ul>
      
      <div className="todo-count">
        {todos.filter(todo => !todo.completed).length} rimasti da completare
      </div>
    </div>
  );
}

export default TodoApp;`,
  `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather App</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 0;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #333;
    }
    
    .container {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      width: 80%;
      max-width: 400px;
    }
    
    .search-box {
      padding: 20px;
      background-color: #f8f9fa;
    }
    
    .search-box input {
      width: 70%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 30px;
      font-size: 16px;
      outline: none;
    }
    
    .search-box button {
      width: 25%;
      padding: 10px;
      background-color: #764ba2;
      color: white;
      border: none;
      border-radius: 30px;
      margin-left: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .weather-info {
      padding: 30px 20px;
      text-align: center;
    }
    
    .city {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .date {
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .temperature {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .description {
      font-size: 18px;
      margin-bottom: 15px;
    }
    
    .details {
      display: flex;
      justify-content: space-around;
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    
    .details-item {
      text-align: center;
    }
    
    .details-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .details-value {
      font-size: 18px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="search-box">
      <input type="text" placeholder="Cerca una città..." id="city-input">
      <button id="search-btn">Cerca</button>
    </div>
    
    <div class="weather-info">
      <div class="city">Roma, IT</div>
      <div class="date">Lunedì 14 Giugno 2023</div>
      <div class="temperature">28°C</div>
      <div class="description">Soleggiato</div>
      
      <div class="details">
        <div class="details-item">
          <div class="details-label">Umidità</div>
          <div class="details-value">65%</div>
        </div>
        <div class="details-item">
          <div class="details-label">Vento</div>
          <div class="details-value">5 km/h</div>
        </div>
        <div class="details-item">
          <div class="details-label">Pressione</div>
          <div class="details-value">1013 hPa</div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    document.getElementById('search-btn').addEventListener('click', function() {
      const city = document.getElementById('city-input').value;
      if (!city) return;
      
      // In una vera applicazione, qui ci sarebbe una chiamata API
      // Per esempio utilizzando l'API di OpenWeatherMap
      
      // Questo è solo un esempio per la simulazione
      document.querySelector('.city').textContent = city + ', IT';
      const temp = Math.floor(Math.random() * 15) + 20;
      document.querySelector('.temperature').textContent = temp + '°C';
      
      const descriptions = ['Soleggiato', 'Poco nuvoloso', 'Nuvoloso', 'Pioggia leggera', 'Temporale'];
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
      document.querySelector('.description').textContent = randomDesc;
      
      document.querySelector('.details-item:nth-child(1) .details-value').textContent = 
        Math.floor(Math.random() * 30) + 50 + '%';
      
      document.querySelector('.details-item:nth-child(2) .details-value').textContent = 
        Math.floor(Math.random() * 10) + 1 + ' km/h';
      
      document.querySelector('.details-item:nth-child(3) .details-value').textContent = 
        Math.floor(Math.random() * 30) + 1000 + ' hPa';
    });
  </script>
</body>
</html>`
];

export const simulateChatResponse = async (
  message: string,
  history: any[]
): Promise<string> => {
  await simulateDelay();
  
  // Check message content to provide relevant responses
  const lowercaseMessage = message.toLowerCase();
  
  if (
    lowercaseMessage.includes("intelligenza artificiale") ||
    lowercaseMessage.includes("ai") ||
    lowercaseMessage.includes("machine learning") ||
    lowercaseMessage.includes("deep learning")
  ) {
    return aiResponses[Math.floor(Math.random() * aiResponses.length)];
  }
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
};

export const simulateDocumentGeneration = async (
  prompt: string,
  options: { style: string; language: string }
): Promise<string> => {
  await simulateDelay(2000, 5000);
  return documentResponses[Math.floor(Math.random() * documentResponses.length)];
};

export const simulateCodeGenerationOLD = async (
  prompt: string,
  language: string,
  history: { role: string; content: string }[],
  currentCode?: string
): Promise<{ code: string; response: string }> => {
  await simulateDelay(2000, 5000);
  
  // If there's current code and the prompt includes modification requests
  if (currentCode && prompt.toLowerCase().includes("modifica")) {
    // This is a simple simulation of code modification
    // In a real implementation, the AI would actually modify the code based on the request
    return {
      code: currentCode.includes("background-color") 
        ? currentCode.replace("background-color: #f5f5f5", "background-color: #e0f7fa") 
        : currentCode,
      response: "Ho modificato il codice come richiesto. Ho cambiato il colore di sfondo per renderlo più gradevole. Puoi vedere l'anteprima aggiornata."
    };
  }
  
  // Return a sample code based on the requested language
  let code = codeSamples[Math.floor(Math.random() * codeSamples.length)];
  let responseText = "Ho creato il codice richiesto. Puoi vedere l'anteprima a destra e visualizzare il codice completo con il pulsante 'Mostra Codice'.";
  
  // If language is specified, try to match a sample
  if (language === "react") {
    code = codeSamples[1]; // React todo app
    responseText = "Ho creato un'applicazione React per la gestione dei task (Todo App). L'app permette di aggiungere, completare ed eliminare task, oltre a filtrarli per stato.";
  } else if (language === "javascript" && prompt.toLowerCase().includes("weather")) {
    code = codeSamples[2]; // Weather app
    responseText = "Ho creato un'app per il meteo con HTML, CSS e JavaScript. L'interfaccia è responsiva e mostra temperatura, umidità e altre informazioni meteorologiche.";
  } else if (language === "html" && prompt.toLowerCase().includes("gallery")) {
    code = codeSamples[0]; // Gallery
    responseText = "Ho creato una galleria di immagini responsive con un effetto lightbox quando clicchi sulle immagini. Utilizza una griglia CSS per il layout responsive e JavaScript vanilla per il lightbox.";
  }
  
  return { code, response: responseText };
};

/**
 * Simula la modifica di codice esistente
 * @param prompt Istruzioni per la modifica
 * @param code Codice da modificare
 * @returns Codice modificato
 */
export const simulateEdit = async (prompt: string, code: string): Promise<string> => {
  await simulateDelay(1000, 3000);
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Simula modifiche comuni basate sul prompt
  let modifiedCode = code;
  
  if (lowerPrompt.includes('colore') || lowerPrompt.includes('color')) {
    // Cambia colori nel codice
    modifiedCode = modifiedCode
      .replace(/#f5f5f5/g, '#e3f2fd')
      .replace(/#333/g, '#1976d2')
      .replace(/background-color:\s*white/gi, 'background-color: #f8f9fa');
  }
  
  if (lowerPrompt.includes('dimensione') || lowerPrompt.includes('size') || lowerPrompt.includes('font')) {
    // Modifica dimensioni font
    modifiedCode = modifiedCode
      .replace(/font-size:\s*16px/gi, 'font-size: 18px')
      .replace(/font-size:\s*14px/gi, 'font-size: 16px');
  }
  
  if (lowerPrompt.includes('margine') || lowerPrompt.includes('margin') || lowerPrompt.includes('spacing')) {
    // Modifica margini e spaziature
    modifiedCode = modifiedCode
      .replace(/margin:\s*10px/gi, 'margin: 15px')
      .replace(/padding:\s*10px/gi, 'padding: 15px');
  }
  
  if (lowerPrompt.includes('bordo') || lowerPrompt.includes('border')) {
    // Aggiunge o modifica bordi
    modifiedCode = modifiedCode
      .replace(/border:\s*none/gi, 'border: 2px solid #ddd')
      .replace(/border-radius:\s*0/gi, 'border-radius: 8px');
  }
  
  if (lowerPrompt.includes('centra') || lowerPrompt.includes('center')) {
    // Centra elementi
    modifiedCode = modifiedCode
      .replace(/text-align:\s*left/gi, 'text-align: center')
      .replace(/justify-content:\s*flex-start/gi, 'justify-content: center');
  }
  
  // Se non ci sono modifiche specifiche, simula una modifica generica
  if (modifiedCode === code) {
    modifiedCode = code + '\n\n/* Modifica applicata tramite AI */';
  }
  
  return modifiedCode;
};

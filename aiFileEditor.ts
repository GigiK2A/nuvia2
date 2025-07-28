import { CodeFile } from '@/store/codeStore';
import { produce } from 'immer';

/**
 * Simula l'editing intelligente di un file di codice basato su un comando in linguaggio naturale
 * Questa funzione viene usata per testare il comportamento dell'agente AI prima dell'integrazione con OpenAI
 */
export function simulateAiFileEdit(
  file: CodeFile,
  command: string
): CodeFile {
  // Normalizza il comando per la ricerca
  const normalizedCommand = command.toLowerCase();
  let updated = file.content;

  switch (file.language) {
    case 'html':
      updated = editHtmlFile(updated, normalizedCommand);
      break;
    case 'css':
      updated = editCssFile(updated, normalizedCommand);
      break;
    case 'javascript':
    case 'jsx':
    case 'typescript':
      updated = editJsFile(updated, normalizedCommand);
      break;
    default:
      // Per altri tipi di file, aggiungiamo solo un commento
      updated = `${updated}\n\n// Modificato in base al comando: ${command}\n`;
  }

  // Usa immer per una modifica immutabile dell'oggetto file
  return produce(file, (draft) => {
    draft.content = updated;
  });
}

/**
 * Funzioni di supporto per manipolare file HTML
 */
function editHtmlFile(content: string, command: string): string {
  let updated = content;

  // Aggiungi footer
  if (command.includes('footer') && (command.includes('aggiungi') || command.includes('crea'))) {
    const currentYear = new Date().getFullYear();
    const footer = `
<footer class="site-footer">
  <div class="container">
    <p>&copy; ${currentYear} - Tutti i diritti riservati</p>
    <nav class="footer-nav">
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">Chi Siamo</a></li>
        <li><a href="#">Contatti</a></li>
        <li><a href="#">Privacy Policy</a></li>
      </ul>
    </nav>
  </div>
</footer>`;
    
    if (updated.includes('</body>')) {
      updated = updated.replace('</body>', `${footer}\n</body>`);
    } else {
      updated += footer;
    }
  }

  // Aggiungi header/intestazione
  if ((command.includes('header') || command.includes('intestazione')) && 
      (command.includes('aggiungi') || command.includes('crea'))) {
    const header = `
<header class="site-header">
  <div class="container">
    <div class="logo">
      <h1>Logo Aziendale</h1>
    </div>
    <nav class="main-nav">
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">Servizi</a></li>
        <li><a href="#">Chi Siamo</a></li>
        <li><a href="#">Contatti</a></li>
      </ul>
    </nav>
  </div>
</header>`;
    
    if (updated.includes('<body>')) {
      updated = updated.replace('<body>', `<body>\n${header}`);
    } else {
      updated = header + updated;
    }
  }

  // Aggiungi titolo principale
  if (command.includes('titolo') && (command.includes('aggiungi') || command.includes('crea'))) {
    const title = `<h1 class="main-title">Titolo Principale</h1>`;
    
    if (updated.includes('<body>')) {
      updated = updated.replace('<body>', `<body>\n${title}`);
    } else if (updated.includes('<header')) {
      // Se c'è un header, inserisci dopo di esso
      const headerCloseIndex = updated.indexOf('</header>');
      if (headerCloseIndex !== -1) {
        updated = 
          updated.substring(0, headerCloseIndex + 9) + 
          `\n<main>\n  ${title}\n` + 
          updated.substring(headerCloseIndex + 9);
      } else {
        updated += `\n<main>\n  ${title}\n</main>`;
      }
    } else {
      updated += `\n<main>\n  ${title}\n</main>`;
    }
  }

  // Aggiungi sezione contatti
  if (command.includes('contatti') && (command.includes('aggiungi') || command.includes('crea'))) {
    const contactSection = `
<section id="contatti" class="contact-section">
  <div class="container">
    <h2>Contattaci</h2>
    <form class="contact-form">
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
      <button type="submit" class="btn btn-primary">Invia Messaggio</button>
    </form>
  </div>
</section>`;
    
    if (updated.includes('</main>')) {
      updated = updated.replace('</main>', `${contactSection}\n</main>`);
    } else if (updated.includes('</body>')) {
      updated = updated.replace('</body>', `${contactSection}\n</body>`);
    } else {
      updated += contactSection;
    }
  }

  // Aggiungi galleria immagini
  if ((command.includes('galleria') || command.includes('immagini')) && 
      (command.includes('aggiungi') || command.includes('crea'))) {
    const gallery = `
<section class="gallery">
  <div class="container">
    <h2>La Nostra Galleria</h2>
    <div class="gallery-grid">
      <div class="gallery-item">
        <img src="https://placehold.co/600x400" alt="Immagine 1">
      </div>
      <div class="gallery-item">
        <img src="https://placehold.co/600x400" alt="Immagine 2">
      </div>
      <div class="gallery-item">
        <img src="https://placehold.co/600x400" alt="Immagine 3">
      </div>
      <div class="gallery-item">
        <img src="https://placehold.co/600x400" alt="Immagine 4">
      </div>
    </div>
  </div>
</section>`;
    
    if (updated.includes('</main>')) {
      updated = updated.replace('</main>', `${gallery}\n</main>`);
    } else if (updated.includes('</body>')) {
      updated = updated.replace('</body>', `${gallery}\n</body>`);
    } else {
      updated += gallery;
    }
  }

  // Aggiungi meta tag per SEO
  if ((command.includes('meta') || command.includes('seo')) && 
      (command.includes('aggiungi') || command.includes('migliora'))) {
    const metaTags = `
  <meta name="description" content="Descrizione della pagina per i motori di ricerca">
  <meta name="keywords" content="parola chiave, SEO, web development">
  <meta name="author" content="Nome Autore">
  <meta property="og:title" content="Titolo per la condivisione sui social">
  <meta property="og:description" content="Descrizione per la condivisione sui social">
  <meta property="og:image" content="https://example.com/image.jpg">
  <meta property="og:url" content="https://example.com">
  <meta name="twitter:card" content="summary_large_image">`;
    
    if (updated.includes('<head>')) {
      updated = updated.replace('<head>', `<head>${metaTags}`);
    } else if (updated.includes('<!DOCTYPE html>')) {
      updated = updated.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n<head>${metaTags}\n</head>`);
    } else {
      updated = `<head>${metaTags}\n</head>\n${updated}`;
    }
  }

  // Aggiungi bootstrap
  if (command.includes('bootstrap') && (command.includes('aggiungi') || command.includes('usa'))) {
    const bootstrapLinks = `
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>`;
    
    if (updated.includes('<head>')) {
      updated = updated.replace('<head>', `<head>${bootstrapLinks}`);
    } else {
      // Se non c'è head, aggiungi all'inizio
      updated = `<head>${bootstrapLinks}\n</head>\n${updated}`;
    }
  }

  return updated;
}

/**
 * Funzioni di supporto per manipolare file CSS
 */
function editCssFile(content: string, command: string): string {
  let updated = content;

  // Cambia colore primario
  if (command.includes('colore') && command.includes('primario')) {
    let color = 'blue';
    
    if (command.includes('rosso')) color = '#e74c3c';
    if (command.includes('blu') || command.includes('blue')) color = '#3498db';
    if (command.includes('verde')) color = '#2ecc71';
    if (command.includes('giallo')) color = '#f1c40f';
    if (command.includes('arancione')) color = '#e67e22';
    if (command.includes('viola')) color = '#9b59b6';
    if (command.includes('nero')) color = '#000000';
    if (command.includes('bianco')) color = '#ffffff';
    
    // Controlla se esiste già una variabile per il colore primario
    if (updated.includes('--primary-color')) {
      updated = updated.replace(/--primary-color:\s*[^;]+;/g, `--primary-color: ${color};`);
    } else if (updated.includes(':root')) {
      // Aggiungi alla root se esiste
      updated = updated.replace(/:root\s*{/, `:root {\n  --primary-color: ${color};`);
    } else {
      // Altrimenti crea il blocco :root
      updated = `:root {\n  --primary-color: ${color};\n}\n\n${updated}`;
    }
  }

  // Cambia colore di sfondo
  if (command.includes('sfondo') || command.includes('background')) {
    let color = '#f8f9fa';
    
    if (command.includes('rosso')) color = '#ffebee';
    if (command.includes('blu') || command.includes('blue')) color = '#e3f2fd';
    if (command.includes('verde')) color = '#e8f5e9';
    if (command.includes('giallo')) color = '#fffde7';
    if (command.includes('arancione')) color = '#fff3e0';
    if (command.includes('viola')) color = '#f3e5f5';
    if (command.includes('nero')) color = '#212121';
    if (command.includes('bianco')) color = '#ffffff';
    if (command.includes('grigio') || command.includes('gray')) color = '#f5f5f5';
    
    if (updated.includes('body')) {
      if (updated.includes('background-color')) {
        updated = updated.replace(/body\s*{[^}]*background-color\s*:\s*[^;]+;[^}]*}/g, (match) => {
          return match.replace(/background-color\s*:\s*[^;]+;/g, `background-color: ${color};`);
        });
      } else {
        updated = updated.replace(/body\s*{/g, `body {\n  background-color: ${color};`);
      }
    } else {
      updated += `\n\nbody {\n  background-color: ${color};\n}`;
    }
  }

  // Aggiungi stile responsive
  if (command.includes('responsive') || command.includes('mobile')) {
    const mediaQueries = `
/* Breakpoint per tablet */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Breakpoint per smartphone */
@media (max-width: 576px) {
  body {
    font-size: 14px;
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
  }
  
  .main-nav ul {
    flex-direction: column;
  }
}`;
    
    updated += mediaQueries;
  }

  // Aggiungi stile per bottoni
  if (command.includes('bottoni') || command.includes('button')) {
    const buttonStyles = `
/* Stili per bottoni */
.btn {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--primary-color, #3498db);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}`;
    
    updated += buttonStyles;
  }

  // Aggiungi animazioni CSS
  if (command.includes('animazioni') || command.includes('animation')) {
    const animations = `
/* Animazioni CSS */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.slide-up {
  animation: slideInUp 0.5s ease-out;
}

/* Effetto hover per le card */
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}`;
    
    updated += animations;
  }

  // Aggiungi stile per il footer
  if (command.includes('footer') && (command.includes('stile') || command.includes('style'))) {
    const footerStyles = `
/* Stile per il footer */
.site-footer {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 40px 0;
  margin-top: 50px;
}

.site-footer a {
  color: #ecf0f1;
  text-decoration: none;
  transition: color 0.3s ease;
}

.site-footer a:hover {
  color: #3498db;
}

.footer-nav ul {
  list-style: none;
  padding: 0;
  margin: 20px 0 0 0;
  display: flex;
  gap: 20px;
}

@media (max-width: 576px) {
  .footer-nav ul {
    flex-direction: column;
    gap: 10px;
  }
}`;
    
    updated += footerStyles;
  }

  return updated;
}

/**
 * Funzioni di supporto per manipolare file JavaScript
 */
function editJsFile(content: string, command: string): string {
  let updated = content;

  // Aggiungi validazione per form
  if (command.includes('validazione') && command.includes('form')) {
    const formValidation = `
// Funzione per validare i form
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function(event) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
      if (input.hasAttribute('required') && !input.value.trim()) {
        isValid = false;
        input.classList.add('is-invalid');
      } else {
        input.classList.remove('is-invalid');
      }
      
      if (input.type === 'email' && input.value) {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(input.value)) {
          isValid = false;
          input.classList.add('is-invalid');
        }
      }
    });
    
    if (!isValid) {
      event.preventDefault();
      alert('Per favore, completa correttamente tutti i campi richiesti.');
    }
  });
}

// Inizializza la validazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function() {
  // Trova tutti i form nella pagina
  const forms = document.querySelectorAll('form');
  forms.forEach((form, index) => {
    if (!form.id) {
      form.id = 'form-' + index;
    }
    validateForm(form.id);
  });
});`;
    
    updated += formValidation;
  }

  // Aggiungi slider/carousel
  if (command.includes('slider') || command.includes('carousel')) {
    const sliderCode = `
// Semplice implementazione di un carousel/slider
class SimpleCarousel {
  constructor(carouselId, options = {}) {
    this.carousel = document.getElementById(carouselId);
    if (!this.carousel) return;
    
    this.slides = this.carousel.querySelectorAll('.carousel-item');
    if (!this.slides.length) return;
    
    this.currentIndex = 0;
    this.interval = options.interval || 3000;
    this.autoplay = options.autoplay !== undefined ? options.autoplay : true;
    
    this.initCarousel();
    if (this.autoplay) this.startAutoplay();
  }
  
  initCarousel() {
    // Nascondi tutte le slide tranne la prima
    this.slides.forEach((slide, index) => {
      if (index !== 0) slide.style.display = 'none';
    });
    
    // Crea i controlli di navigazione
    this.createControls();
  }
  
  createControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'carousel-controls';
    
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&lt;';
    prevButton.className = 'carousel-control prev';
    prevButton.addEventListener('click', () => this.prevSlide());
    
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&gt;';
    nextButton.className = 'carousel-control next';
    nextButton.addEventListener('click', () => this.nextSlide());
    
    controlsDiv.appendChild(prevButton);
    controlsDiv.appendChild(nextButton);
    this.carousel.appendChild(controlsDiv);
  }
  
  showSlide(index) {
    this.slides.forEach(slide => slide.style.display = 'none');
    this.slides[index].style.display = 'block';
  }
  
  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.showSlide(this.currentIndex);
  }
  
  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.showSlide(this.currentIndex);
  }
  
  startAutoplay() {
    this.autoplayInterval = setInterval(() => this.nextSlide(), this.interval);
  }
  
  stopAutoplay() {
    clearInterval(this.autoplayInterval);
  }
}

// Inizializza il carousel quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function() {
  new SimpleCarousel('carousel', { autoplay: true, interval: 4000 });
});`;
    
    updated += sliderCode;
  }

  // Aggiungi dark mode
  if (command.includes('dark mode') || command.includes('tema scuro')) {
    const darkModeCode = `
// Implementazione della dark mode
function initDarkMode() {
  const darkModeToggle = document.createElement('button');
  darkModeToggle.id = 'dark-mode-toggle';
  darkModeToggle.innerHTML = '🌙';
  darkModeToggle.title = 'Attiva/disattiva modalità scura';
  darkModeToggle.classList.add('dark-mode-toggle');
  
  // Stile per il toggle button
  darkModeToggle.style.position = 'fixed';
  darkModeToggle.style.bottom = '20px';
  darkModeToggle.style.right = '20px';
  darkModeToggle.style.borderRadius = '50%';
  darkModeToggle.style.width = '50px';
  darkModeToggle.style.height = '50px';
  darkModeToggle.style.fontSize = '20px';
  darkModeToggle.style.border = 'none';
  darkModeToggle.style.background = '#f1f1f1';
  darkModeToggle.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  darkModeToggle.style.cursor = 'pointer';
  darkModeToggle.style.zIndex = '1000';
  
  document.body.appendChild(darkModeToggle);
  
  // Verifica se la dark mode è già attiva
  let isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  // Applica il tema al caricamento
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '☀️';
  }
  
  // Toggle per la dark mode
  darkModeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.innerHTML = '☀️';
    } else {
      document.body.classList.remove('dark-mode');
      darkModeToggle.innerHTML = '🌙';
    }
  });
}

// Inizializza la dark mode quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function() {
  initDarkMode();
});`;
    
    updated += darkModeCode;
  }

  // Aggiungi animazioni scroll
  if (command.includes('animazioni scroll') || command.includes('scroll animation')) {
    const scrollAnimationsCode = `
// Implementazione di semplici animazioni allo scroll
function initScrollAnimations() {
  // Trova tutti gli elementi da animare
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  
  // Osservatore per l'intersezione (supporto moderno)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    animateElements.forEach(el => observer.observe(el));
  } else {
    // Fallback per browser che non supportano IntersectionObserver
    function checkScroll() {
      animateElements.forEach(el => {
        const elementTop = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.9) {
          el.classList.add('animated');
        }
      });
    }
    
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Verifica iniziale
  }
}

// Inizializza le animazioni allo scroll quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function() {
  initScrollAnimations();
});`;
    
    updated += scrollAnimationsCode;
  }

  return updated;
}
/**
 * Servizio per la gestione dei progetti utente
 * Fornisce funzioni per caricare e salvare i progetti
 */

// Tipo per i progetti
export interface Project {
  id: number;
  ownerId: number;
  name: string;
  files: Record<string, string>;
  createdAt: string;
}

/**
 * Carica i progetti dell'utente (o tutti i progetti se l'utente è admin)
 * @returns Array dei progetti
 */
export async function loadProjects(): Promise<Project[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token non trovato');
    }

    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Errore nel caricamento dei progetti');
    }

    const data = await response.json();
    return data.data?.projects || [];
  } catch (error) {
    console.error('Errore durante il caricamento dei progetti:', error);
    return [];
  }
}

/**
 * Salva un nuovo progetto associato all'utente corrente
 * @param name Nome del progetto
 * @param files Oggetto contenente i file del progetto (nome file: contenuto)
 * @returns Risposta dal server
 */
export async function saveProject(name: string, files: Record<string, string>): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token non trovato');
    }

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, files })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Errore durante il salvataggio del progetto');
    }

    return data;
  } catch (error) {
    console.error('Errore durante il salvataggio del progetto:', error);
    throw error;
  }
}

/**
 * Carica un singolo progetto
 * @param id ID del progetto da caricare
 * @returns Il progetto specificato
 */
export async function loadProject(id: number): Promise<Project> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token non trovato');
    }

    const response = await fetch(`/api/projects/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Errore nel caricamento del progetto');
    }

    const data = await response.json();
    return data.data?.project;
  } catch (error) {
    console.error(`Errore durante il caricamento del progetto ${id}:`, error);
    throw error;
  }
}
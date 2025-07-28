/**
 * Funzione per salvare un progetto nel database
 * @param name Nome del progetto
 * @param files Oggetto contenente i file del progetto (nome file: contenuto)
 * @returns La risposta dal server
 */
export async function saveProject(name: string, files: Record<string, string>) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Utente non autenticato');
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
}
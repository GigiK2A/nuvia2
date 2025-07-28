import { useState, useEffect } from 'react';

interface AgentState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAgent = () => {
  const [state, setState] = useState<AgentState>({
    isConnected: true, // Assume connesso per il momento
    isLoading: false,
    error: null,
  });

  // Simula il controllo della connessione
  useEffect(() => {
    const checkConnection = () => {
      setState(prev => ({
        ...prev,
        isConnected: navigator.onLine,
      }));
    };

    // Controlla la connessione iniziale
    checkConnection();

    // Ascolta i cambiamenti di connessione
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  return state;
};
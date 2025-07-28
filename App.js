import React, { useEffect, useState } from 'react';

/**
 * Componente principale dell'interfaccia Nuvia. Mostra un esempio di
 * interazione con il backend tramite l'endpoint di health check e
 * fornisce un layout di base su cui costruire chatbot, editor di codice
 * e generatore di documenti.
 */
function App() {
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    // Effettua una richiesta al backend per verificare lo stato del server
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status))
      .catch((err) => {
        console.error('Errore nel contattare il backend:', err);
        setApiStatus('offline');
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Nuvia AI Assistant</h1>
      <p>Stato del backend: {apiStatus || 'verifica in corso...'}</p>
      <section style={{ marginTop: '2rem' }}>
        <h2>Chatbot</h2>
        <p>Qui verrà integrata l'interfaccia conversazionale con memoria utente.</p>
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>Editor di codice</h2>
        <p>Area per la creazione e la modifica di progetti con AI.</p>
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>Generatore di documenti</h2>
        <p>Sezione dedicata ai modelli PDF/Word e alla compilazione assistita.</p>
      </section>
    </div>
  );
}

export default App;
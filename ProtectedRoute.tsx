import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  component: React.ComponentType;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ component: Component, adminOnly = false }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLocation('/login');
          return;
        }
        
        // Verifica se l'utente è autenticato
        const authResponse = await fetch('/api/protected', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!authResponse.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLocation('/login');
          return;
        }
        
        setIsAuthenticated(true);
        
        // Se richiediamo un ruolo admin, verifica che l'utente sia admin
        if (adminOnly) {
          // Controlla il ruolo dell'utente
          const userString = localStorage.getItem('user');
          if (userString) {
            const user = JSON.parse(userString);
            if (user.role === 'admin') {
              setIsAdmin(true);
            } else {
              // Utente autenticato ma non admin
              setLocation('/');
              return;
            }
          } else {
            // Prova a verificare tramite chiamata API
            const adminResponse = await fetch('/api/admin', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!adminResponse.ok) {
              setLocation('/');
              return;
            }
            
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Errore verifica autenticazione:', error);
        setLocation('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [setLocation, adminOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return null; // Il redirect è già gestito dall'effetto
  }

  if (!isAuthenticated) {
    return null; // Il redirect è già gestito dall'effetto
  }

  return <Component />;
}
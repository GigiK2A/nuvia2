import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, User, Key } from 'lucide-react';

interface UserProfileProps {
  className?: string;
}

export default function UserProfile({ className }: UserProfileProps) {
  const [user, setUser] = useState<{
    id?: number;
    email?: string;
    role?: string;
  } | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Carica i dati dell'utente dal localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        console.error('Errore nel parsing dei dati utente:', err);
      }
    }
  }, []);

  // Funzione per cambiare la password (simulata)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validazione
    if (newPassword.length < 6) {
      setError('La nuova password deve avere almeno 6 caratteri');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In una implementazione reale, qui ci sarebbe una chiamata API
      // al backend per cambiare la password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulazione
      
      toast({
        title: 'Password aggiornata',
        description: 'La tua password è stata modificata con successo',
      });
      
      // Chiudi il dialog e resetta i campi
      setIsDialogOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Si è verificato un errore durante l\'aggiornamento della password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Utente non autenticato</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Profilo Utente</CardTitle>
        <CardDescription>
          Visualizza e gestisci le informazioni del tuo account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-col space-y-1">
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{user.email}</p>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label className="text-muted-foreground">Ruolo</Label>
            <p className="font-medium capitalize">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? 'Amministratore' : 'Utente'}
              </span>
            </p>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label className="text-muted-foreground">ID Utente</Label>
            <p className="font-medium">{user.id}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Key className="mr-2 h-4 w-4" />
              Cambia Password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambia Password</DialogTitle>
              <DialogDescription>
                Inserisci la tua password attuale e quella nuova per aggiornare le credenziali.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password">Password Attuale</Label>
                <Input
                  id="old-password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="text-sm font-medium text-destructive">
                  {error}
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aggiornamento...
                    </>
                  ) : (
                    'Salva Modifiche'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
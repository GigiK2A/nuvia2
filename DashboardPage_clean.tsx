import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Settings, LogOut, UserPlus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Stati principali
  const [user, setUser] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  
  // Stati per la gestione utenti
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form per nuovo utente
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  });

  // ✅ Carica preferenze PostgreSQL
  const { data: userProfile } = useQuery({
    queryKey: ['/api/preferences'],
  });

  // ✅ Aggiorna stato con dati PostgreSQL
  useEffect(() => {
    if (userProfile) {
      setUserPreferences(userProfile);
    }
  }, [userProfile]);

  // Verifica autenticazione
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/protected', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAdmin(data.user?.role === 'admin');
          setLastLogin(data.user?.lastLogin);
        } else {
          setLocation('/login');
        }
      } catch (error) {
        console.error('Errore verifica autenticazione:', error);
        setLocation('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  // Carica utenti (solo per admin)
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLocation('/login');
  };

  const handleCreateUser = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Utente creato",
          description: "Il nuovo utente è stato creato con successo",
        });
        setIsDialogOpen(false);
        setFormData({ email: '', password: '', role: 'user' });
        loadUsers();
      } else {
        const errorData = await response.json();
        toast({
          title: "Errore",
          description: errorData.message || "Impossibile creare l'utente",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore di connessione",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Utente eliminato",
          description: "L'utente è stato eliminato con successo",
        });
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'utente",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Benvenuto{userPreferences?.name ? `, ${userPreferences.name}` : ''}! 👋
            </h1>
            <p className="text-muted-foreground">
              Dashboard di controllo del tuo assistente AI personale
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Gestione Utenti</TabsTrigger>}
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Stato Account
                  </CardTitle>
                  <Badge variant="secondary">Attivo</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user?.role === 'admin' ? 'Amministratore' : 'Utente'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ultimo accesso: {lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Mai'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversazioni
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">
                    +3 rispetto al mese scorso
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Progetti Generati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    +2 questa settimana
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Documenti Analizzati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15</div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX e TXT processati
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Attività Recente</CardTitle>
                  <CardDescription>
                    Le tue interazioni più recenti con l'assistente AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium">Chat Agent</p>
                        <p className="text-sm text-muted-foreground">
                          Conversazione su sviluppo React - 2 ore fa
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium">Genera Codice</p>
                        <p className="text-sm text-muted-foreground">
                          Creato componente dashboard - 5 ore fa
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium">Documento Analyzer</p>
                        <p className="text-sm text-muted-foreground">
                          Analizzato PDF progetto - Ieri
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Preferenze AI</CardTitle>
                  <CardDescription>
                    Configurazione attuale dell'assistente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Lingua:</span>
                      <Badge variant="outline">
                        {userPreferences?.language === 'it' ? '🇮🇹 Italiano' : '🇺🇸 English'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Stile AI:</span>
                      <Badge variant="outline">
                        {userPreferences?.ai_style || 'Conversational'}
                      </Badge>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Modifica Preferenze
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Gestione Utenti
                      </CardTitle>
                      <CardDescription>
                        Amministra gli utenti del sistema
                      </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Nuovo Utente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingUser ? 'Modifica Utente' : 'Crea Nuovo Utente'}
                          </DialogTitle>
                          <DialogDescription>
                            Inserisci i dettagli per il nuovo utente
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              placeholder="user@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              placeholder="Password sicura"
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Ruolo</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona ruolo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utente</SelectItem>
                                <SelectItem value="admin">Amministratore</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annulla
                          </Button>
                          <Button onClick={handleCreateUser} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingUser ? 'Aggiorna' : 'Crea'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Creato: {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="settings">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Impostazioni Account</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Profilo Utente</CardTitle>
                  <CardDescription>
                    Per modificare le impostazioni dettagliate del profilo, usa la pagina Impostazioni dedicata.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <p className="text-lg">{userPreferences?.name || 'Non impostato'}</p>
                      </div>
                      <div>
                        <Label>Cognome</Label>
                        <p className="text-lg">{userPreferences?.surname || 'Non impostato'}</p>
                      </div>
                    </div>
                    <div>
                      <Label>Lingua</Label>
                      <p className="text-lg">
                        {userPreferences?.language === 'it' ? '🇮🇹 Italiano' : '🇺🇸 English'}
                      </p>
                    </div>
                    <div>
                      <Label>Stile AI</Label>
                      <p className="text-lg">{userPreferences?.ai_style || 'Conversational'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
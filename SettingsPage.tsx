import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Download, Trash2, Shield, Bell, User, Palette, Brain, Lock } from 'lucide-react';
import type { UserSettings, UpdateUserSettings } from '@shared/schema';

interface UserProfile {
  id: number;
  email: string;
  role: string;
  settings?: UserSettings;
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [profileData, setProfileData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    avatarUrl: ''
  });
  
  const [preferences, setPreferences] = useState({
    language: 'it',
    aiModel: 'gpt-4',
    aiResponseStyle: 'conversational',
    customSystemPrompt: '',
    emailReminders: true,
    aiUpdates: false,
    twoFactorEnabled: false
  });

  // Carica preferenze utente dal sistema PostgreSQL
  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ['/api/preferences'],
  });

  // Aggiorna lo stato quando i dati cambiano
  React.useEffect(() => {
    if (userPreferences) {
      setProfileData({
        email: '',
        firstName: userPreferences.name || '',
        lastName: userPreferences.surname || '',
        avatarUrl: ''
      });
      
      setPreferences({
        language: userPreferences.language || 'it',
        aiModel: 'gpt-4',
        aiResponseStyle: userPreferences.ai_style || 'conversational',
        customSystemPrompt: '',
        emailReminders: true,
        aiUpdates: false,
        twoFactorEnabled: false
      });
    }
  }, [userPreferences]);

  // Mutation unificata per PostgreSQL - salva TUTTO insieme
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/preferences', {
        name: data.firstName || profileData.firstName,
        surname: data.lastName || profileData.lastName,
        language: preferences.language,
        ai_style: preferences.aiResponseStyle
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Preferenze salvate!",
        description: "Nome, cognome e impostazioni aggiornati correttamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      // Ricarica la pagina per aggiornare il dashboard
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il profilo",
        variant: "destructive",
      });
    }
  });

  // ✅ UNICA MUTATION - Solo PostgreSQL
  const saveAllMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/preferences', {
        name: data.name,
        surname: data.surname,
        language: data.language,
        ai_style: data.ai_style
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Tutto salvato!",
        description: "Nome, cognome, lingua e stile AI aggiornati",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      // Ricarica per aggiornare il dashboard
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive",
      });
    }
  });

  // Mutation per backup dati
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/user/backup');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Backup completato",
        description: "I tuoi dati sono stati scaricati con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il backup",
        variant: "destructive",
      });
    }
  });

  // Mutation per eliminare account
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/user/account');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account eliminato",
        description: "Il tuo account è stato rimosso definitivamente",
      });
      // Redirect al login
      window.location.href = '/login';
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'account",
        variant: "destructive",
      });
    }
  });

  const handleProfileUpdate = () => {
    // ✅ SALVA SOLO nel PostgreSQL
    saveAllMutation.mutate({
      name: profileData.firstName,
      surname: profileData.lastName,
      language: preferences.language,
      ai_style: preferences.aiResponseStyle
    });
  };

  const handleSettingsUpdate = () => {
    // ✅ SALVA SOLO nel PostgreSQL
    saveAllMutation.mutate({
      name: profileData.firstName,
      surname: profileData.lastName,
      language: preferences.language,
      ai_style: preferences.aiResponseStyle
    });
  };

  const handleBackup = () => {
    backupMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione non può essere annullata.')) {
      deleteAccountMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-10" id="settings-form">
      {/* Sezione Profilo Utente */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profilo Utente</h2>
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 rounded-full border">
            <AvatarImage src={profileData.avatarUrl} />
            <AvatarFallback>
              {profileData.firstName?.[0]?.toUpperCase() || 'U'}{profileData.lastName?.[0]?.toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1">
            <Input
              type="text"
              id="firstName"
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Nome"
              className="w-full border border-gray-300 rounded-md p-2"
            />
            <Input
              type="text"
              id="lastName"
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Cognome"
              className="w-full border border-gray-300 rounded-md p-2"
            />
            <Button
              onClick={handleProfileUpdate}
              disabled={saveAllMutation.isPending}
              variant="outline"
              size="sm"
              className="border border-gray-300 bg-white px-4 py-2 rounded-md font-medium"
            >
              {saveAllMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salva Profilo
            </Button>
          </div>
        </div>
      </section>

      {/* Sezione Preferenze Generali */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Preferenze Generali</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 block">Lingua</span>
            <Select
              value={preferences.language}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger className="w-full border border-gray-300 rounded-md bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </section>

      {/* Impostazioni AI */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Brain className="h-5 w-5 mr-2" />
          <div>
            <CardTitle>Preferenze IA</CardTitle>
            <CardDescription>Configura il comportamento dell'assistente AI</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="aiModel">Modello AI Predefinito</Label>
              <Select
                value={preferences.aiModel}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, aiModel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="aiResponseStyle">Stile Risposta</Label>
              <Select
                value={preferences.aiResponseStyle}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, aiResponseStyle: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversational">Conversazionale</SelectItem>
                  <SelectItem value="formal">Formale</SelectItem>
                  <SelectItem value="technical">Tecnico</SelectItem>
                  <SelectItem value="creative">Creativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="customPrompt">Prompt Personalizzato (System Prompt)</Label>
            <Textarea
              id="customPrompt"
              value={preferences.customSystemPrompt}
              onChange={(e) => setPreferences(prev => ({ ...prev, customSystemPrompt: e.target.value }))}
              placeholder="Es. Rispondi come un assistente tecnico professionale con esempi pratici..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sicurezza */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Lock className="h-5 w-5 mr-2" />
          <div>
            <CardTitle>Sicurezza</CardTitle>
            <CardDescription>Proteggi il tuo account con funzionalità avanzate</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="2fa"
              checked={preferences.twoFactorEnabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, twoFactorEnabled: checked }))}
            />
            <Label htmlFor="2fa">Abilita autenticazione a due fattori (2FA)</Label>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Aumenta la sicurezza del tuo account richiedendo un codice aggiuntivo durante l'accesso
          </p>
        </CardContent>
      </Card>

      {/* Notifiche */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Bell className="h-5 w-5 mr-2" />
          <div>
            <CardTitle>Notifiche</CardTitle>
            <CardDescription>Gestisci come e quando ricevere aggiornamenti</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="emailReminders"
              checked={preferences.emailReminders}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailReminders: checked }))}
            />
            <Label htmlFor="emailReminders">Ricevi promemoria eventi via email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="aiUpdates"
              checked={preferences.aiUpdates}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, aiUpdates: checked }))}
            />
            <Label htmlFor="aiUpdates">Aggiornamenti e novità dell'IA</Label>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Dati */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Shield className="h-5 w-5 mr-2" />
          <div>
            <CardTitle>Backup & Dati</CardTitle>
            <CardDescription>Gestisci i tuoi dati e l'account</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleBackup}
              disabled={backupMutation.isPending}
              variant="outline"
            >
              {backupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Download className="h-4 w-4 mr-2" />
              Scarica Backup
            </Button>
            <Button 
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              variant="destructive"
            >
              {deleteAccountMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina Account
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Il backup include tutte le tue conversazioni, progetti e impostazioni in formato JSON.
          </p>
        </CardContent>
      </Card>

      {/* Pulsante Salva Preferenze - Stile Elegante */}
      <Button 
        onClick={handleSettingsUpdate}
        disabled={saveAllMutation.isPending}
        className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
      >
        {saveAllMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        💾 Salva Preferenze
      </Button>
    </div>
  );
};

export default SettingsPage;
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Tipo per gli utenti recuperati dal server
type User = {
  id: number;
  email: string;
  role: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [tab, setTab] = useState('panoramica');

  // Query per ottenere la lista degli utenti
  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato');
      }
      
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli utenti');
      }
      
      return response.json();
    },
  });

  const users = usersData?.data?.users || [];

  return (
    <div className="min-h-screen bg-white p-6 pt-16">
      <header className="mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          className="text-2xl font-semibold text-gray-800"
        >
          🚀 Nuova Dashboard - Luigi! 👋
        </motion.h1>
        <p className="text-sm text-gray-500">Dashboard di controllo del tuo assistente AI personale</p>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white rounded-full shadow-sm p-1 mb-6 flex gap-2 w-fit mx-auto">
          {[
            { value: 'panoramica', label: 'Panoramica' },
            { value: 'utenti', label: 'Gestione Utenti' },
            { value: 'impostazioni', label: 'Impostazioni' }
          ].map((tabItem) => (
            <TabsTrigger 
              key={tabItem.value} 
              value={tabItem.value} 
              className={`px-4 py-2 text-sm font-medium relative ${tab === tabItem.value ? 'text-black' : 'text-gray-500'}`}
            >
              {tab === tabItem.value && (
                <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800 rounded-full" />
              )}
              {tabItem.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="panoramica">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[{
              label: 'Conversazioni',
              value: '24'
            }, {
              label: 'Progetti Generati',
              value: '8'
            }, {
              label: 'Documenti Analizzati',
              value: '15'
            }, {
              label: 'Stato Account',
              value: 'Attivo',
              color: 'text-green-600'
            }].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className={`text-2xl font-semibold ${item.color || ''}`}>{item.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-base font-medium text-gray-800 mb-2">Attività Recente</h2>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>Chat Agent</strong> – 2 ore fa</li>
                    <li><strong>Genera Codice</strong> – 5 ore fa</li>
                    <li><strong>Documento Analyzer</strong> – Ieri</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-base font-medium text-gray-800 mb-2">Preferenze AI</h2>
                  <p className="text-sm text-gray-600">Lingua: <strong>US English</strong></p>
                  <p className="text-sm text-gray-600">Stile: <strong>Creativo</strong></p>
                  <Button variant="outline" className="mt-4">Modifica Preferenze</Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="utenti">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-800">Gestione Utenti</h2>
            <Button variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Nuovo Utente</Button>
          </div>
          <div className="space-y-4">
            {users.map((user: User, idx: number) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.email}</p>
                    <span className="text-xs text-gray-500">Creato: {new Date(user.createdAt).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon"><Trash className="w-4 h-4" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="impostazioni">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            className="bg-white p-6 rounded-xl shadow-sm max-w-xl"
          >
            <h2 className="text-xl font-medium text-gray-800 mb-6">Profilo Utente</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nome</label>
                <Input placeholder="Luigi" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Cognome</label>
                <Input placeholder="Inserisci il tuo cognome" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Stile AI</label>
              <Input placeholder="Creativo" />
            </div>
            <Button variant="outline" className="w-full">💾 Salva Modifiche</Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
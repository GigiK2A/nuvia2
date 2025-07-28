// File: components/NuviaCalendarEmbed.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NuviaCalendarEmbedProps {
  userEmail?: string;
  userId: number;
}

export default function NuviaCalendarEmbed({ userEmail = 'user@example.com', userId }: NuviaCalendarEmbedProps) {
  const [showForm, setShowForm] = useState(false);
  const iframeUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
    userEmail
  )}&ctz=Europe%2FRome&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;

  return (
    <div className="space-y-6">
      {/* Calendar Embed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Il tuo Calendario Google
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg overflow-hidden">
            <iframe
              src={iframeUrl}
              style={{ border: 0 }}
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              className="w-full"
              title="Google Calendar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Event Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Nascondi creazione evento' : 'Crea nuovo evento'}
        </Button>
      </div>

      {/* Event Creation Form */}
      {showForm && <EventForm userId={userId} onClose={() => setShowForm(false)} />}
    </div>
  );
}

interface EventFormProps {
  userId: number;
  onClose: () => void;
}

function EventForm({ userId, onClose }: EventFormProps) {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!summary || !startDateTime || !endDateTime) {
      toast({
        title: "Errore",
        description: "Inserisci almeno titolo, data e orario di inizio e fine",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      toast({
        title: "Errore",
        description: "L'orario di fine deve essere successivo all'orario di inizio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/calendar/${userId}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          summary, 
          description, 
          startTime: new Date(startDateTime).toISOString(),
          endTime: new Date(endDateTime).toISOString()
        }),
      });

      if (response.ok) {
        toast({
          title: "Evento creato",
          description: "L'evento è stato aggiunto al tuo calendario Google",
        });
        
        // Reset form
        setSummary('');
        setDescription('');
        setStartDateTime('');
        setEndDateTime('');
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione dell\'evento');
      }
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Impossibile creare l'evento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimeChange = (value: string) => {
    setStartDateTime(value);
    // Auto-set end time to 1 hour after start if not already set
    if (!endDateTime && value) {
      const endTime = new Date(value);
      endTime.setHours(endTime.getHours() + 1);
      setEndDateTime(endTime.toISOString().slice(0, 16));
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Nuovo evento Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titolo *
          </label>
          <Input
            placeholder="Es: Riunione di lavoro"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione
          </label>
          <Textarea
            placeholder="Descrizione dell'evento (opzionale)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data e ora inizio *
            </label>
            <Input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data e ora fine *
            </label>
            <Input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            {loading ? 'Creazione in corso...' : 'Salva evento'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annulla
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
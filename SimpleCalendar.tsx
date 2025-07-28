import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  color: string;
}

const eventColors = [
  'bg-primary',
  'bg-accent',
  'bg-destructive',
  'bg-secondary',
  'hsl(var(--galactic-pink))',
  'hsl(var(--cosmic-blue))'
];

export default function SimpleCalendar({ userId }: { userId: number }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '',
    location: '',
    color: eventColors[0]
  });
  const { toast } = useToast();

  // Get calendar days for current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Load events
  useEffect(() => {
    loadEvents();
  }, [userId]);

  const loadEvents = async () => {
    try {
      const response = await fetch(`/api/calendar/${userId}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleCreateEvent = async () => {
    if (!selectedDate || !newEvent.title.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci almeno il titolo dell'evento",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      ...newEvent,
      date: selectedDate.toISOString().split('T')[0],
      id: `event-${Date.now()}`
    };

    try {
      const response = await fetch(`/api/calendar/${userId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const savedEvent = await response.json();
        setEvents(prev => [...prev, savedEvent]);
        setShowEventForm(false);
        setNewEvent({
          title: '',
          description: '',
          time: '',
          location: '',
          color: eventColors[0]
        });
        toast({
          title: "Successo",
          description: "Evento creato con successo",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile creare l'evento",
        variant: "destructive",
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold stellar-text mb-2">Calendario</h1>
          <p className="text-muted-foreground">Gestisci i tuoi eventi e appuntamenti</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="space-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="stellar-text text-2xl">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      className="space-button"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      className="space-button"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth().map((date, index) => {
                    if (!date) {
                      return <div key={index} className="p-2 h-24" />;
                    }

                    const dayEvents = getEventsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <motion.div
                        key={date.toISOString()}
                        whileHover={{ scale: 1.02 }}
                        className={`p-2 h-24 border rounded-lg cursor-pointer transition-all duration-200 ${
                          isToday ? 'hologram-effect border-primary' : 'quantum-border hover:bg-secondary/20'
                        }`}
                        onClick={() => handleDateClick(date)}
                      >
                        <div className="text-sm font-medium mb-1">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded truncate"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} altri
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's events */}
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="stellar-text flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Eventi di Oggi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getEventsForDate(new Date()).length > 0 ? (
                  <div className="space-y-3">
                    {getEventsForDate(new Date()).map(event => (
                      <div key={event.id} className="hologram-effect p-3 rounded-lg">
                        <div className="font-medium">{event.title}</div>
                        {event.time && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </div>
                        )}
                        {event.location && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nessun evento per oggi</p>
                )}
              </CardContent>
            </Card>

            {/* Quick add */}
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="stellar-text">Aggiungi Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    setSelectedDate(new Date());
                    setShowEventForm(true);
                  }}
                  className="w-full space-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo Evento
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event creation modal */}
        <AnimatePresence>
          {showEventForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md"
              >
                <Card className="space-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="stellar-text">Nuovo Evento</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEventForm(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedDate && (
                      <p className="text-muted-foreground">
                        {selectedDate.toLocaleDateString('it-IT', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="stellar-text">Titolo *</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Inserisci il titolo dell'evento"
                        className="cosmic-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="time" className="stellar-text">Orario</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="cosmic-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location" className="stellar-text">Luogo</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="Inserisci il luogo dell'evento"
                        className="cosmic-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="stellar-text">Descrizione</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Inserisci una descrizione"
                        className="cosmic-input"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="stellar-text">Colore</Label>
                      <div className="flex gap-2 mt-2">
                        {eventColors.map((color, index) => (
                          <button
                            key={index}
                            onClick={() => setNewEvent({ ...newEvent, color })}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                              newEvent.color === color ? 'border-foreground scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleCreateEvent}
                        className="flex-1 space-button"
                      >
                        Crea Evento
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowEventForm(false)}
                        className="flex-1"
                      >
                        Annulla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
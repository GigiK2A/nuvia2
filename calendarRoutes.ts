import { Router } from 'express';

const router = Router();

// In-memory storage for calendar events
interface CalendarEvent {
  id: string;
  userId: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEvents: CalendarEvent[] = [];

// Get events for a specific user
router.get('/calendar/:userId/events', async (req, res) => {
  try {
    const { userId } = req.params;
    const userEvents = calendarEvents.filter(event => event.userId === parseInt(userId));
    res.json(userEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get events for today
router.get('/calendar/:userId/today', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const todayEvents = calendarEvents.filter(event => 
      event.userId === parseInt(userId) && event.date === today
    );
    
    res.json(todayEvents);
  } catch (error) {
    console.error('Error fetching today events:', error);
    res.status(500).json({ error: 'Failed to fetch today events' });
  }
});

// Create a new event
router.post('/calendar/:userId/events', async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, description, date, time, location, color } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: parseInt(userId),
      title,
      description: description || '',
      date,
      time: time || '',
      location: location || '',
      color: color || 'hsl(var(--primary))',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    calendarEvents.push(newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update an event
router.put('/calendar/:userId/events/:eventId', async (req, res) => {
  try {
    const { userId, eventId } = req.params;
    const { title, description, date, time, location, color } = req.body;

    const eventIndex = calendarEvents.findIndex(event => 
      event.id === eventId && event.userId === parseInt(userId)
    );

    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    calendarEvents[eventIndex] = {
      ...calendarEvents[eventIndex],
      title,
      description,
      date,
      time,
      location,
      color,
      updatedAt: new Date()
    };

    res.json(calendarEvents[eventIndex]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete an event
router.delete('/calendar/:userId/events/:eventId', async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    const eventIndex = calendarEvents.findIndex(event => 
      event.id === eventId && event.userId === parseInt(userId)
    );

    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    calendarEvents.splice(eventIndex, 1);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
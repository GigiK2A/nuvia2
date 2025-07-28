// File: routes/nuviaRoutes.ts

import express from 'express';
import { google } from 'googleapis';
import { oauth2Client } from './authGoogle';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 📅 GET /api/calendar/:userId/today
router.get('/calendar/:userId/today', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: parseInt(req.params.userId) } 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Note: This would need the user's Google tokens from database
    // oauth2Client.setCredentials(user.gtoken);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(events.data.items || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving Google Calendar events' });
  }
});

// 📅 POST /api/calendar/:userId/create
router.post('/calendar/:userId/create', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: parseInt(req.params.userId) } 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has Google OAuth tokens
    if (!user.googleAccessToken) {
      return res.status(401).json({ error: 'Google Calendar access not authorized' });
    }

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { summary, description, startTime, endTime } = req.body;
    
    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields: summary, startTime, endTime' });
    }

    const event = {
      summary,
      description: description || '',
      start: { dateTime: startTime },
      end: { dateTime: endTime },
    };

    const created = await calendar.events.insert({ 
      calendarId: 'primary', 
      requestBody: event 
    });
    
    res.json(created.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating calendar event' });
  }
});

// 🧠 GET /api/memory/:userId
router.get('/memory/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const preferences = await prisma.userPreferences.findUnique({ 
      where: { userId } 
    });
    
    res.json({ memo: preferences?.systemPrompt || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving memory' });
  }
});

// 🧠 POST /api/memory/:userId - Update/Create user memo
router.post('/memory/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { memo } = req.body;
    
    if (!memo || typeof memo !== 'string') {
      return res.status(400).json({ error: 'Memo is required and must be a string' });
    }
    
    const updated = await prisma.userPreferences.upsert({
      where: { userId },
      update: { 
        systemPrompt: memo, 
        updatedAt: new Date() 
      },
      create: { 
        userId, 
        systemPrompt: memo,
        preferredLanguage: 'it',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });
    
    res.json({ 
      success: true, 
      memo: updated.systemPrompt,
      message: 'Memory updated successfully' 
    });
  } catch (err) {
    console.error('Error updating memory:', err);
    res.status(500).json({ error: 'Error updating memory' });
  }
});

// 📁 GET /api/projects/last/:userId
router.get('/projects/last/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const project = await prisma.project.findFirst({
      where: { userId: userId.toString() },
      orderBy: { updatedAt: 'desc' },
    });
    
    res.json(project || { name: 'Nessun progetto attivo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving last project' });
  }
});

// 💬 POST /api/ai/chat
router.post('/ai/chat', async (req, res) => {
  try {
    const { input, userId, context } = req.body;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input is required and must be a string' });
    }

    const fullPrompt = `You are Nuvia, a smart assistant and secretary for the user.
Project: ${context?.project?.name || 'None'}
Memo: ${context?.memo || 'None'}
User message: ${input}

Respond in Italian, be helpful and professional.`;

    // Import the AI service directly to avoid recursive calls
    const { generateAIResponse } = require('../utils/aiClient');
    
    const response = await generateAIResponse(fullPrompt);
    
    res.json({ reply: response });
  } catch (err) {
    console.error('Nuvia AI chat error:', err);
    res.json({ reply: 'Mi dispiace, al momento non riesco a elaborare la tua richiesta. Riprova più tardi.' });
  }
});

export default router;
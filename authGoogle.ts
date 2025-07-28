// File: routes/authGoogle.ts

import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Dynamic redirect URI based on environment
const getRedirectUri = () => {
  // Force use of development environment URL for now
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS}/auth/google/callback`;
  }
  
  // For Replit deployed environment
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`;
  }
  
  // Fallback for local development
  return 'http://localhost:5000/auth/google/callback';
};

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri()
);

// Debug endpoint to check OAuth configuration
router.get('/auth/google/debug', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
    redirectUri: getRedirectUri(),
    environment: {
      replSlug: process.env.REPL_SLUG,
      replOwner: process.env.REPL_OWNER
    }
  });
});

// 🔐 Step 1: redirect login
router.get('/auth/google', (req, res) => {
  const redirectUri = getRedirectUri();
  console.log('Debug - REPL_SLUG:', process.env.REPL_SLUG);
  console.log('Debug - REPL_OWNER:', process.env.REPL_OWNER);
  console.log('Debug - GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
  console.log('Google OAuth redirect URI:', redirectUri);
  console.log('GOOGLE_CLIENT_ID presente:', process.env.GOOGLE_CLIENT_ID ? 'Sì' : 'No');
  console.log('GOOGLE_CLIENT_SECRET presente:', process.env.GOOGLE_CLIENT_SECRET ? 'Sì' : 'No');
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });
  res.redirect(url);
});

// 🔐 Step 2: callback
router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send('Codice di autorizzazione mancante');
  }

  try {
    const tokenResponse = await oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const userData = userInfo.data;
    
    // Generate JWT token for our system
    const { generateToken } = await import('../authConfig');
    const jwtToken = generateToken({
      id: parseInt(userData.id || '1'),
      email: userData.email || 'user@gmail.com',
      role: 'user'
    });

    // Set token as HTTP-only cookie and redirect
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect('/?auth=success');
  } catch (err) {
    console.error('Errore OAuth Google:', err);
    res.status(500).send('Errore durante l\'autenticazione Google');
  }
});

export { oauth2Client };
export default router;
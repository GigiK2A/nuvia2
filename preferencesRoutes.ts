// ✅ Endpoint aggiornamento preferenze utente
import express from 'express';
import { pool } from './db';
import { verifyToken } from './authConfig';

const router = express.Router();

// Authentication middleware applied to individual routes where needed

// GET preferenze utente
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    console.log('🔍 Caricamento preferenze per userId:', userId);
    
    const result = await pool.query(
      'SELECT name, surname, language, ai_style FROM user_preferences WHERE user_id = $1', 
      [userId]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      // Restituisci valori di default se non esistono preferenze
      res.json({
        name: '',
        surname: '',
        language: 'it',
        ai_style: 'assistente-tecnico'
      });
    }
  } catch (err) {
    console.error('❌ Errore caricamento preferenze', err);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel caricamento delle preferenze' 
    });
  }
});

// POST aggiornamento preferenze utente
router.post('/preferences', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { name, surname, language, ai_style } = req.body;
    
    console.log('📝 Salvataggio preferenze per userId:', userId, {
      name, surname, language, ai_style
    });
    
    await pool.query(`
      INSERT INTO user_preferences (user_id, name, surname, language, ai_style) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        name = $2, 
        surname = $3, 
        language = $4, 
        ai_style = $5,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, name, surname, language, ai_style]);
    
    console.log('✅ Preferenze salvate con successo per userId:', userId);
    res.json({ success: true, message: 'Preferenze salvate con successo' });
  } catch (err) {
    console.error('❌ Errore salvataggio preferenze', err);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel salvataggio delle preferenze' 
    });
  }
});

export default router;
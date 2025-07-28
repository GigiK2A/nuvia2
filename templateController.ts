import { Request, Response } from 'express';
import { pool } from './db';

/**
 * Salva un nuovo template personalizzato
 * POST /api/templates/save
 */
export const saveTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, files } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Utente non autenticato' 
      });
    }

    if (!name || !files) {
      return res.status(400).json({ 
        success: false,
        error: 'Nome e files sono richiesti' 
      });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Files deve essere un array non vuoto' 
      });
    }

    // Validazione files
    for (const file of files) {
      if (!file.path || !file.content) {
        return res.status(400).json({
          success: false,
          error: 'Ogni file deve avere path e content'
        });
      }
    }

    console.log(`💾 Salvando template "${name}" per user ${userId}`);

    const result = await pool.query(
      'INSERT INTO templates (user_id, name, description, files) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [userId, name, description || null, JSON.stringify(files)]
    );

    const templateId = result.rows[0].id;
    const createdAt = result.rows[0].created_at;

    console.log(`✅ Template salvato con ID: ${templateId}`);

    res.status(200).json({ 
      success: true,
      message: 'Template salvato con successo',
      data: {
        id: templateId,
        name,
        description,
        filesCount: files.length,
        createdAt
      }
    });

  } catch (err: any) {
    console.error('❌ Errore salvataggio template:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Errore nel salvataggio del template',
      details: err.message
    });
  }
};

/**
 * Recupera tutti i template di un utente
 * GET /api/templates/user/:userId
 */
export const getUserTemplates = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.userId;

    // Verifica che l'utente possa accedere ai template
    if (parseInt(userId) !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato ad accedere a questi template'
      });
    }

    console.log(`📋 Recuperando template per user ${userId}`);

    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        description, 
        created_at,
        jsonb_array_length(files) as files_count
       FROM templates 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    console.log(`✅ Trovati ${result.rows.length} template`);

    res.status(200).json({
      success: true,
      data: {
        templates: result.rows,
        total: result.rows.length
      }
    });

  } catch (err: any) {
    console.error('❌ Errore recupero template:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Errore nel recupero dei template',
      details: err.message
    });
  }
};

/**
 * Carica un template specifico con tutti i files
 * GET /api/templates/:templateId
 */
export const loadTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const currentUserId = (req as any).user?.userId;

    if (!templateId || isNaN(parseInt(templateId))) {
      return res.status(400).json({
        success: false,
        error: 'ID template non valido'
      });
    }

    console.log(`📁 Caricando template ${templateId}`);

    const result = await pool.query(
      'SELECT * FROM templates WHERE id = $1',
      [templateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Template non trovato' 
      });
    }

    const template = result.rows[0];

    // Verifica che l'utente possa accedere al template
    if (template.user_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato ad accedere a questo template'
      });
    }

    console.log(`✅ Template "${template.name}" caricato`);

    res.status(200).json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          files: template.files, // JSONB viene automaticamente parsato
          createdAt: template.created_at,
          filesCount: template.files.length
        }
      }
    });

  } catch (err: any) {
    console.error('❌ Errore caricamento template:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Errore nel caricamento del template',
      details: err.message
    });
  }
};

/**
 * Elimina un template
 * DELETE /api/templates/:templateId
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const currentUserId = (req as any).user?.userId;

    if (!templateId || isNaN(parseInt(templateId))) {
      return res.status(400).json({
        success: false,
        error: 'ID template non valido'
      });
    }

    // Verifica che il template esista e appartenga all'utente
    const checkResult = await pool.query(
      'SELECT name, user_id FROM templates WHERE id = $1',
      [templateId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template non trovato'
      });
    }

    const template = checkResult.rows[0];

    if (template.user_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a eliminare questo template'
      });
    }

    console.log(`🗑️ Eliminando template "${template.name}" (ID: ${templateId})`);

    await pool.query(
      'DELETE FROM templates WHERE id = $1',
      [templateId]
    );

    console.log(`✅ Template eliminato con successo`);

    res.status(200).json({
      success: true,
      message: 'Template eliminato con successo',
      data: {
        deletedTemplate: {
          id: parseInt(templateId),
          name: template.name
        }
      }
    });

  } catch (err: any) {
    console.error('❌ Errore eliminazione template:', err.message);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del template',
      details: err.message
    });
  }
};

/**
 * Aggiorna un template esistente
 * PUT /api/templates/:templateId
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { name, description, files } = req.body;
    const currentUserId = (req as any).user?.userId;

    if (!templateId || isNaN(parseInt(templateId))) {
      return res.status(400).json({
        success: false,
        error: 'ID template non valido'
      });
    }

    // Verifica che il template esista e appartenga all'utente
    const checkResult = await pool.query(
      'SELECT user_id FROM templates WHERE id = $1',
      [templateId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template non trovato'
      });
    }

    if (checkResult.rows[0].user_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a modificare questo template'
      });
    }

    // Prepara i campi da aggiornare
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (files) {
      if (!Array.isArray(files)) {
        return res.status(400).json({
          success: false,
          error: 'Files deve essere un array'
        });
      }
      updates.push(`files = $${paramCount++}`);
      values.push(JSON.stringify(files));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun campo da aggiornare fornito'
      });
    }

    values.push(templateId);

    console.log(`✏️ Aggiornando template ${templateId}`);

    const result = await pool.query(
      `UPDATE templates SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING name, description, created_at`,
      values
    );

    console.log(`✅ Template aggiornato con successo`);

    res.status(200).json({
      success: true,
      message: 'Template aggiornato con successo',
      data: {
        template: result.rows[0]
      }
    });

  } catch (err: any) {
    console.error('❌ Errore aggiornamento template:', err.message);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento del template',
      details: err.message
    });
  }
};
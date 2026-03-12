const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// POST /api/questions — submit a question
router.post('/', async (req, res) => {
  const { sessionCode, text, authorName } = req.body;
  if (!sessionCode || !text || !authorName) {
    return res.status(400).json({ error: 'sessionCode, text and authorName are required' });
  }

  const db = getDb();
  const { data: session } = await db
    .from('sessions')
    .select('id')
    .eq('code', sessionCode.toUpperCase().trim())
    .eq('is_active', true)
    .maybeSingle();

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { data: question, error } = await db
    .from('questions')
    .insert({ session_id: session.id, text: text.trim(), author_name: authorName.trim() })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(question);
});

// GET /api/questions/:id — get a single question
router.get('/:id', async (req, res) => {
  const db = getDb();
  const { data: question } = await db
    .from('questions')
    .select('*')
    .eq('id', Number(req.params.id))
    .maybeSingle();
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json(question);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Sessions expire after SESSION_TTL_HOURS (default 24). Returns true if expired.
function isExpired(session) {
  const ttlHours = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);
  const createdAt = new Date(session.created_at);
  return (Date.now() - createdAt.getTime()) > ttlHours * 60 * 60 * 1000;
}

// Mark a session inactive in the DB and return the error response
async function expireSession(db, session, res) {
  await db.from('sessions').update({ is_active: false }).eq('id', session.id);
  return res.status(404).json({ error: 'Session has expired and been automatically ended' });
}

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// POST /api/sessions — create a new session
router.post('/', async (req, res) => {
  const { title, hostName } = req.body;
  if (!title || !hostName) {
    return res.status(400).json({ error: 'title and hostName are required' });
  }

  const db = getDb();

  // Generate a unique code
  let code;
  let attempts = 0;
  do {
    if (++attempts > 100) return res.status(500).json({ error: 'Could not generate unique code' });
    code = generateCode();
    const { data: existing } = await db.from('sessions').select('id').eq('code', code).maybeSingle();
    if (!existing) break;
  } while (true);

  const { data: session, error } = await db
    .from('sessions')
    .insert({ code, title: title.trim(), host_name: hostName.trim() })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(session);
});

// GET /api/sessions/:code — load full session data
router.get('/:code', async (req, res) => {
  const db = getDb();
  const code = req.params.code.toUpperCase().trim();

  const { data: session } = await db
    .from('sessions')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (!session) {
    return res.status(404).json({ error: 'Session not found or has ended' });
  }

  if (isExpired(session)) {
    return expireSession(db, session, res);
  }

  const [{ data: questions }, { data: polls }] = await Promise.all([
    db.from('questions').select('*').eq('session_id', session.id)
      .order('vote_count', { ascending: false }).order('created_at', { ascending: true }),
    db.from('polls').select('*').eq('session_id', session.id)
      .order('created_at', { ascending: true }),
  ]);

  const enrichedPolls = await Promise.all((polls || []).map(async (poll) => {
    const { data: options } = poll.type === 'multiple_choice'
      ? await db.from('poll_options').select('*').eq('poll_id', poll.id).order('order_index')
      : { data: [] };
    return { ...poll, options: options || [], responses: [] };
  }));

  res.json({ ...session, questions: questions || [], polls: enrichedPolls });
});

// DELETE /api/sessions/:code — end a session
router.delete('/:code', async (req, res) => {
  const db = getDb();
  await db.from('sessions').update({ is_active: false })
    .eq('code', req.params.code.toUpperCase().trim());
  res.json({ success: true });
});

module.exports = router;

const { getDb } = require('../db/database');
const { computeResults } = require('../routes/polls');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {

    // ─── Join Session ────────────────────────────────────────────────────────
    socket.on('join-session', async ({ code, role, participantId }) => {
      if (!code) return;
      const db = getDb();
      const upperCode = code.toUpperCase().trim();

      const { data: session } = await db
        .from('sessions')
        .select('*')
        .eq('code', upperCode)
        .eq('is_active', true)
        .maybeSingle();

      if (!session) {
        socket.emit('error', { message: 'Session not found or has ended' });
        return;
      }

      // Auto-expire sessions older than SESSION_TTL_HOURS (default 24)
      const ttlHours = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);
      const age = Date.now() - new Date(session.created_at).getTime();
      if (age > ttlHours * 60 * 60 * 1000) {
        await db.from('sessions').update({ is_active: false }).eq('id', session.id);
        socket.emit('session-ended', { reason: 'Session has expired and been automatically ended' });
        return;
      }

      socket.sessionCode   = upperCode;
      socket.sessionId     = session.id;
      socket.role          = role;
      socket.participantId = participantId;
      socket.join(`session:${upperCode}`);

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
        const results = await computeResults(db, poll);
        return { ...poll, options: options || [], results };
      }));

      socket.emit('session-data', { ...session, questions: questions || [], polls: enrichedPolls });
    });

    // ─── Submit Question ─────────────────────────────────────────────────────
    socket.on('submit-question', async ({ text, authorName }) => {
      if (!socket.sessionId || !text || !authorName) return;
      if (text.trim().length === 0 || text.length > 500) return;

      const db = getDb();
      const { data: question, error } = await db
        .from('questions')
        .insert({ session_id: socket.sessionId, text: text.trim(), author_name: authorName.trim() })
        .select()
        .single();

      if (error) return;
      io.to(`session:${socket.sessionCode}`).emit('new-question', question);
    });

    // ─── Vote on Question ────────────────────────────────────────────────────
    socket.on('vote-question', async ({ questionId, action }) => {
      if (!socket.sessionId || !socket.participantId) return;

      const db = getDb();
      const qId = Number(questionId);

      const { data: question } = await db
        .from('questions').select('*')
        .eq('id', qId).eq('session_id', socket.sessionId)
        .maybeSingle();
      if (!question) return;

      const { data: existingVote } = await db
        .from('question_voters').select('id')
        .eq('question_id', qId).eq('voter_id', socket.participantId)
        .maybeSingle();

      if (action === 'add' && !existingVote) {
        await db.from('question_voters').insert({ question_id: qId, voter_id: socket.participantId });
        await db.from('questions').update({ vote_count: question.vote_count + 1 }).eq('id', qId);
      } else if (action === 'remove' && existingVote) {
        await db.from('question_voters').delete()
          .eq('question_id', qId).eq('voter_id', socket.participantId);
        await db.from('questions')
          .update({ vote_count: Math.max(0, question.vote_count - 1) }).eq('id', qId);
      }

      const { data: updated } = await db.from('questions').select('*').eq('id', qId).single();
      io.to(`session:${socket.sessionCode}`).emit('question-updated', updated);
    });

    // ─── Mark Question Answered ──────────────────────────────────────────────
    socket.on('mark-answered', async ({ questionId }) => {
      if (socket.role !== 'host' || !socket.sessionId) return;

      const db = getDb();
      const qId = Number(questionId);

      const { data: question } = await db
        .from('questions').select('*')
        .eq('id', qId).eq('session_id', socket.sessionId)
        .maybeSingle();
      if (!question) return;

      await db.from('questions').update({ is_answered: !question.is_answered }).eq('id', qId);
      const { data: updated } = await db.from('questions').select('*').eq('id', qId).single();
      io.to(`session:${socket.sessionCode}`).emit('question-updated', updated);
    });

    // ─── Delete Question (host) ──────────────────────────────────────────────
    socket.on('delete-question', async ({ questionId }) => {
      if (socket.role !== 'host' || !socket.sessionId) return;

      const db = getDb();
      const qId = Number(questionId);

      await db.from('question_voters').delete().eq('question_id', qId);
      await db.from('questions').delete().eq('id', qId).eq('session_id', socket.sessionId);
      io.to(`session:${socket.sessionCode}`).emit('question-deleted', { questionId: qId });
    });

    // ─── Create Poll (host) ──────────────────────────────────────────────────
    socket.on('create-poll', async ({ title, type, options }) => {
      if (socket.role !== 'host' || !socket.sessionId) return;
      if (!title || !type) return;
      if (!['multiple_choice', 'word_cloud', 'rating'].includes(type)) return;

      const db = getDb();

      const { data: poll, error } = await db
        .from('polls')
        .insert({ session_id: socket.sessionId, title: title.trim(), type })
        .select().single();
      if (error) return;

      let pollOptions = [];
      if (type === 'multiple_choice' && Array.isArray(options)) {
        const rows = options
          .filter(o => o && o.trim())
          .map((o, idx) => ({ poll_id: poll.id, text: o.trim(), order_index: idx }));
        if (rows.length > 0) {
          const { data } = await db.from('poll_options').insert(rows).select();
          pollOptions = data || [];
        }
      }

      const results = await computeResults(db, poll);
      io.to(`session:${socket.sessionCode}`).emit('poll-created', { ...poll, options: pollOptions, results });
    });

    // ─── Activate Poll (host) ────────────────────────────────────────────────
    socket.on('activate-poll', async ({ pollId }) => {
      if (socket.role !== 'host' || !socket.sessionId) return;

      const db = getDb();
      const pId = Number(pollId);

      const { data: poll } = await db
        .from('polls').select('*')
        .eq('id', pId).eq('session_id', socket.sessionId)
        .maybeSingle();
      if (!poll || poll.is_closed) return;

      await db.from('polls').update({ is_active: false }).eq('session_id', socket.sessionId);
      await db.from('polls').update({ is_active: true }).eq('id', pId);

      const { data: updated } = await db.from('polls').select('*').eq('id', pId).single();
      const { data: opts } = updated.type === 'multiple_choice'
        ? await db.from('poll_options').select('*').eq('poll_id', pId).order('order_index')
        : { data: [] };
      const results = await computeResults(db, updated);

      io.to(`session:${socket.sessionCode}`).emit('poll-activated', {
        ...updated, options: opts || [], results,
      });
    });

    // ─── Close Poll (host) ───────────────────────────────────────────────────
    socket.on('close-poll', async ({ pollId }) => {
      if (socket.role !== 'host' || !socket.sessionId) return;

      const db = getDb();
      const pId = Number(pollId);

      await db.from('polls').update({ is_active: false, is_closed: true })
        .eq('id', pId).eq('session_id', socket.sessionId);
      io.to(`session:${socket.sessionCode}`).emit('poll-closed', { pollId: pId });
    });

    // ─── Delete Poll (host) ──────────────────────────────────────────────────
    socket.on('delete-poll', async ({ pollId }) => {
      if (socket.role !== 'host' || !socket.sessionId) return;

      const db = getDb();
      const pId = Number(pollId);

      await db.from('poll_responses').delete().eq('poll_id', pId);
      await db.from('poll_options').delete().eq('poll_id', pId);
      await db.from('polls').delete().eq('id', pId).eq('session_id', socket.sessionId);
      io.to(`session:${socket.sessionCode}`).emit('poll-deleted', { pollId: pId });
    });

    // ─── Submit Poll Response (participant) ───────────────────────────────────
    socket.on('submit-response', async ({ pollId, optionId, textResponse, ratingValue }) => {
      if (!socket.sessionId || !socket.participantId) return;

      const db = getDb();
      const pId = Number(pollId);

      const { data: poll } = await db
        .from('polls').select('*')
        .eq('id', pId).eq('session_id', socket.sessionId)
        .eq('is_active', true).eq('is_closed', false)
        .maybeSingle();
      if (!poll) {
        socket.emit('response-error', { message: 'Poll is not active' });
        return;
      }

      const { data: existing } = await db
        .from('poll_responses').select('id')
        .eq('poll_id', pId).eq('respondent_id', socket.participantId)
        .maybeSingle();
      if (existing) {
        socket.emit('response-error', { message: 'Already responded to this poll' });
        return;
      }

      let oId = null, tResp = null, rVal = null;

      if (poll.type === 'multiple_choice') {
        if (optionId == null) return;
        const { data: opt } = await db.from('poll_options').select('id')
          .eq('id', Number(optionId)).eq('poll_id', pId).maybeSingle();
        if (!opt) return;
        oId = opt.id;
      } else if (poll.type === 'word_cloud') {
        if (!textResponse || textResponse.trim().length === 0) return;
        tResp = textResponse.trim().slice(0, 200);
      } else if (poll.type === 'rating') {
        const val = Number(ratingValue);
        if (!Number.isInteger(val) || val < 1 || val > 10) return;
        rVal = val;
      }

      await db.from('poll_responses').insert({
        poll_id: pId,
        respondent_id: socket.participantId,
        option_id: oId,
        text_response: tResp,
        rating_value: rVal,
      });

      const { data: updatedPoll } = await db.from('polls').select('*').eq('id', pId).single();
      const results = await computeResults(db, updatedPoll);

      socket.emit('response-accepted', { pollId: pId });
      io.to(`session:${socket.sessionCode}`).emit('poll-results-updated', { pollId: pId, results });
    });

    // ─── End Session (host) ──────────────────────────────────────────────────
    socket.on('end-session', async () => {
      if (socket.role !== 'host' || !socket.sessionCode) return;

      const db = getDb();
      await db.from('sessions').update({ is_active: false }).eq('code', socket.sessionCode);
      io.to(`session:${socket.sessionCode}`).emit('session-ended');
    });

    socket.on('disconnect', () => {
      // socket.io manages room cleanup automatically
    });
  });
}

module.exports = { setupSocketHandlers };

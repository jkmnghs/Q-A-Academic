const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/polls/:id/results — get computed results for a poll
router.get('/:id/results', async (req, res) => {
  const db = getDb();
  const pollId = Number(req.params.id);

  const { data: poll } = await db.from('polls').select('*').eq('id', pollId).maybeSingle();
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  const results = await computeResults(db, poll);
  res.json(results);
});

async function computeResults(db, poll) {
  const { data: responses } = await db.from('poll_responses').select('*').eq('poll_id', poll.id);
  const allResponses = responses || [];
  const totalResponses = allResponses.length;

  if (poll.type === 'multiple_choice') {
    const { data: options } = await db
      .from('poll_options')
      .select('*')
      .eq('poll_id', poll.id)
      .order('order_index');

    const counts = {};
    for (const r of allResponses) {
      if (r.option_id != null) counts[r.option_id] = (counts[r.option_id] || 0) + 1;
    }

    return {
      type: 'multiple_choice',
      totalResponses,
      options: (options || []).map(opt => ({
        id: opt.id,
        text: opt.text,
        count: counts[opt.id] || 0,
        percentage: totalResponses > 0 ? Math.round(((counts[opt.id] || 0) / totalResponses) * 100) : 0,
      })),
    };
  }

  if (poll.type === 'word_cloud') {
    const wordFreq = {};
    for (const r of allResponses) {
      if (r.text_response) {
        const words = r.text_response.trim().toLowerCase().split(/\s+/);
        for (const word of words) {
          const clean = word.replace(/[^a-z0-9]/g, '');
          if (clean.length > 1) wordFreq[clean] = (wordFreq[clean] || 0) + 1;
        }
      }
    }
    const words = Object.entries(wordFreq)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 60);

    return { type: 'word_cloud', totalResponses, words };
  }

  if (poll.type === 'rating') {
    const values = allResponses
      .filter(r => r.rating_value != null)
      .map(r => r.rating_value);

    const average = values.length > 0
      ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
      : 0;

    const distribution = Array.from({ length: 10 }, (_, i) => ({
      value: i + 1,
      count: values.filter(v => v === i + 1).length,
    }));

    return { type: 'rating', totalResponses, average, distribution };
  }

  return { type: poll.type, totalResponses };
}

module.exports = router;
module.exports.computeResults = computeResults;

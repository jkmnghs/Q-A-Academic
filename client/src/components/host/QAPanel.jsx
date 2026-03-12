import { useState } from 'react';

export default function QAPanel({ questions, socket, sessionCode }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unanswered' | 'answered'
  const [sort, setSort] = useState('votes'); // 'votes' | 'newest'

  function handleMarkAnswered(questionId) {
    socket?.emit('mark-answered', { questionId });
  }

  function handleDelete(questionId) {
    if (!window.confirm('Delete this question?')) return;
    socket?.emit('delete-question', { questionId });
  }

  let filtered = questions.filter(q => {
    if (filter === 'unanswered') return !q.is_answered;
    if (filter === 'answered')   return !!q.is_answered;
    return true;
  });

  if (sort === 'newest') {
    filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const unansweredCount = questions.filter(q => !q.is_answered).length;
  const answeredCount   = questions.filter(q =>  q.is_answered).length;

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Filter chips */}
        <div className="flex gap-2">
          {[
            { key: 'all',        label: `All (${questions.length})` },
            { key: 'unanswered', label: `Pending (${unansweredCount})` },
            { key: 'answered',   label: `Answered (${answeredCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none"
        >
          <option value="votes">Sort by votes</option>
          <option value="newest">Sort by newest</option>
        </select>
      </div>

      {/* Empty state */}
      {questions.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-sm font-medium">Waiting for questions…</p>
          <p className="text-xs mt-1">Share your code so participants can start asking.</p>
        </div>
      )}

      {questions.length > 0 && filtered.length === 0 && (
        <div className="card p-8 text-center text-slate-400 text-sm">
          No questions match this filter.
        </div>
      )}

      {/* Question list */}
      <div className="space-y-3">
        {filtered.map(q => (
          <div
            key={q.id}
            className={`card p-4 animate-slide-up transition-all ${
              q.is_answered ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Vote count */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[2.5rem] bg-slate-50 border border-slate-100 rounded-xl p-2">
                <span className="text-lg font-bold text-indigo-600 leading-none">{q.vote_count}</span>
                <span className="text-xs text-slate-400 mt-0.5">▲</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-slate-800 leading-relaxed ${q.is_answered ? 'line-through text-slate-400' : ''}`}>
                  {q.text}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-slate-400">{q.author_name}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{timeAgo(q.created_at)}</span>
                  {q.is_answered && (
                    <span className="badge bg-green-100 text-green-700">✓ Answered</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <button
                  onClick={() => handleMarkAnswered(q.id)}
                  title={q.is_answered ? 'Mark as unanswered' : 'Mark as answered'}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                    q.is_answered
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {q.is_answered ? 'Reopen' : '✓ Answer'}
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  title="Delete question"
                  className="text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

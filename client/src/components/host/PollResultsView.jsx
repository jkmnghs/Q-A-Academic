import WordCloudDisplay from '../shared/WordCloudDisplay.jsx';

const TYPE_LABELS = {
  multiple_choice: 'Multiple Choice',
  word_cloud: 'Word Cloud',
  rating: 'Rating Scale',
};

const TYPE_ICONS = {
  multiple_choice: '☑️',
  word_cloud: '☁️',
  rating: '⭐',
};

export default function PollResultsView({ poll, socket }) {
  function handleActivate() {
    socket?.emit('activate-poll', { pollId: poll.id });
  }

  function handleClose() {
    socket?.emit('close-poll', { pollId: poll.id });
  }

  function handleDelete() {
    if (!window.confirm('Delete this poll and all its responses?')) return;
    socket?.emit('delete-poll', { pollId: poll.id });
  }

  const results = poll.results;
  const totalResponses = results?.totalResponses ?? 0;

  const statusColor = poll.is_active
    ? 'bg-green-100 text-green-700 border-green-200'
    : poll.is_closed
      ? 'bg-slate-100 text-slate-600'
      : 'bg-amber-100 text-amber-700';

  const statusLabel = poll.is_active ? '● Live' : poll.is_closed ? 'Closed' : 'Draft';

  return (
    <div className={`card p-5 ${poll.is_active ? 'ring-2 ring-green-400' : ''}`}>
      {/* Poll header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">{TYPE_ICONS[poll.type]}</span>
          <div>
            <h3 className="font-semibold text-slate-900">{poll.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge border ${statusColor}`}>{statusLabel}</span>
              <span className="badge bg-slate-100 text-slate-600">{TYPE_LABELS[poll.type]}</span>
              <span className="text-xs text-slate-400">{totalResponses} response{totalResponses !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!poll.is_active && !poll.is_closed && (
            <button onClick={handleActivate} className="btn-primary text-xs px-3 py-1.5">
              ▶ Start
            </button>
          )}
          {poll.is_active && (
            <button onClick={handleClose} className="btn-secondary text-xs px-3 py-1.5">
              ■ Close
            </button>
          )}
          {!poll.is_active && (
            <button onClick={handleDelete} className="text-xs px-2 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {totalResponses === 0 ? (
        <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-400 text-sm">
          {poll.is_active ? '⏳ Waiting for responses…' : 'No responses yet.'}
        </div>
      ) : (
        <div>
          {poll.type === 'multiple_choice' && results && (
            <MultipleChoiceResults results={results} />
          )}
          {poll.type === 'word_cloud' && results && (
            <WordCloudResults results={results} />
          )}
          {poll.type === 'rating' && results && (
            <RatingResults results={results} />
          )}
        </div>
      )}
    </div>
  );
}

function MultipleChoiceResults({ results }) {
  const max = Math.max(...(results.options?.map(o => o.count) ?? [1]), 1);
  return (
    <div className="space-y-2.5">
      {results.options?.map(opt => (
        <div key={opt.id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-700 font-medium">{opt.text}</span>
            <span className="text-slate-500 text-xs">{opt.count} · {opt.percentage}%</span>
          </div>
          <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${opt.count === 0 ? 0 : Math.max((opt.count / max) * 100, 4)}%` }}
            >
              {opt.percentage > 10 && (
                <span className="text-white text-xs font-semibold">{opt.percentage}%</span>
              )}
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-400 pt-1 text-right">
        {results.totalResponses} total response{results.totalResponses !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function WordCloudResults({ results }) {
  return (
    <div>
      <WordCloudDisplay words={results.words ?? []} />
      <p className="text-xs text-slate-400 text-center mt-2">
        {results.totalResponses} response{results.totalResponses !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function RatingResults({ results }) {
  const max = Math.max(...(results.distribution?.map(d => d.count) ?? [1]), 1);
  return (
    <div>
      {/* Average score */}
      <div className="text-center mb-4">
        <div className="text-5xl font-extrabold text-indigo-600">{results.average}</div>
        <div className="text-slate-400 text-sm mt-1">average out of 10</div>
        <div className="text-slate-400 text-xs">{results.totalResponses} response{results.totalResponses !== 1 ? 's' : ''}</div>
      </div>

      {/* Distribution bars */}
      <div className="flex items-end justify-center gap-1.5 h-16">
        {results.distribution?.map(d => (
          <div key={d.value} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className="w-full rounded-t bg-indigo-400 transition-all duration-500 min-h-[2px]"
              style={{ height: `${d.count === 0 ? 2 : Math.round((d.count / max) * 56) + 4}px` }}
              title={`${d.value}: ${d.count} votes`}
            />
            <span className="text-xs text-slate-400">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

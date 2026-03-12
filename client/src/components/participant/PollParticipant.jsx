import { useState } from 'react';
import WordCloudDisplay from '../shared/WordCloudDisplay.jsx';

const TYPE_LABELS = {
  multiple_choice: 'Multiple Choice',
  word_cloud: 'Word Cloud',
  rating: 'Rating Scale',
};

export default function PollParticipant({ poll, socket, participantId, hasResponded }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [wordInput, setWordInput] = useState('');
  const [ratingValue, setRatingValue] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!socket) return;
    setError('');

    if (poll.type === 'multiple_choice' && selectedOption == null) {
      setError('Please choose an option.');
      return;
    }
    if (poll.type === 'word_cloud' && !wordInput.trim()) {
      setError('Please type a response.');
      return;
    }
    if (poll.type === 'rating' && ratingValue == null) {
      setError('Please select a rating.');
      return;
    }

    setSubmitting(true);

    socket.emit('submit-response', {
      pollId: poll.id,
      optionId:      poll.type === 'multiple_choice' ? selectedOption : null,
      textResponse:  poll.type === 'word_cloud'      ? wordInput.trim() : null,
      ratingValue:   poll.type === 'rating'          ? ratingValue : null,
    });

    // response-accepted event handled in ParticipantView → hasResponded will flip
    setTimeout(() => setSubmitting(false), 1000);
  }

  // ── Closed or not active ───────────────────────────────────────────────────
  if (poll.is_closed && !hasResponded) {
    return (
      <div className="card p-5 opacity-60">
        <PollHeader poll={poll} />
        <p className="text-sm text-slate-400 mt-3 text-center">This poll is now closed.</p>
      </div>
    );
  }

  // ── Already responded — show results ──────────────────────────────────────
  if (hasResponded) {
    const results = poll.results;
    return (
      <div className="card p-5">
        <PollHeader poll={poll} />
        <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2.5 mb-4">
          ✓ Your response was recorded. Here are the live results:
        </div>
        {results && poll.type === 'multiple_choice' && <MCResults results={results} />}
        {results && poll.type === 'word_cloud'      && <WCResults results={results} />}
        {results && poll.type === 'rating'          && <RatingResults results={results} />}
      </div>
    );
  }

  // ── Not yet active & no response ──────────────────────────────────────────
  if (!poll.is_active) {
    return (
      <div className="card p-5 opacity-60">
        <PollHeader poll={poll} />
        <p className="text-sm text-slate-400 mt-3 text-center">Waiting for host to start this poll…</p>
      </div>
    );
  }

  // ── Active — show response form ────────────────────────────────────────────
  return (
    <div className="card p-5 ring-2 ring-purple-400 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Live Now</span>
      </div>

      <PollHeader poll={poll} />

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {/* Multiple Choice */}
        {poll.type === 'multiple_choice' && (
          <div className="space-y-2.5">
            {poll.options?.map(opt => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  selectedOption === opt.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name={`poll_${poll.id}`}
                  value={opt.id}
                  checked={selectedOption === opt.id}
                  onChange={() => setSelectedOption(opt.id)}
                  className="accent-purple-600"
                />
                <span className="text-sm text-slate-800">{opt.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* Word Cloud */}
        {poll.type === 'word_cloud' && (
          <input
            className="input"
            placeholder="Type your response…"
            value={wordInput}
            onChange={e => setWordInput(e.target.value)}
            maxLength={200}
          />
        )}

        {/* Rating Scale */}
        {poll.type === 'rating' && (
          <div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRatingValue(val)}
                  className={`aspect-square rounded-xl text-sm font-bold transition active:scale-95 ${
                    ratingValue === val
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="btn-primary w-full py-3 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit Response'}
        </button>
      </form>
    </div>
  );
}

function PollHeader({ poll }) {
  const icons = { multiple_choice: '☑️', word_cloud: '☁️', rating: '⭐' };
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg">{icons[poll.type]}</span>
      <div>
        <h3 className="font-semibold text-slate-900 text-sm">{poll.title}</h3>
        <span className="text-xs text-slate-400">{TYPE_LABELS[poll.type]}</span>
      </div>
    </div>
  );
}

function MCResults({ results }) {
  const max = Math.max(...(results.options?.map(o => o.count) ?? [1]), 1);
  return (
    <div className="space-y-2.5">
      {results.options?.map(opt => (
        <div key={opt.id}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">{opt.text}</span>
            <span className="text-slate-400">{opt.count} · {opt.percentage}%</span>
          </div>
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${opt.count === 0 ? 0 : Math.max((opt.count / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WCResults({ results }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <WordCloudDisplay words={results.words ?? []} />
    </div>
  );
}

function RatingResults({ results }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-extrabold text-purple-600">{results.average}</div>
      <div className="text-slate-400 text-xs mt-1">average · {results.totalResponses} responses</div>
      <div className="flex items-end justify-center gap-1 h-12 mt-3">
        {results.distribution?.map(d => {
          const max = Math.max(...(results.distribution?.map(x => x.count) ?? [1]), 1);
          return (
            <div key={d.value} className="flex flex-col items-center gap-0.5 flex-1">
              <div
                className="w-full rounded-t bg-purple-400 transition-all"
                style={{ height: `${d.count === 0 ? 2 : Math.round((d.count / max) * 40) + 4}px` }}
              />
              <span className="text-xs text-slate-400">{d.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

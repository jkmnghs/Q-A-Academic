import { useState } from 'react';

export default function QAParticipant({
  questions,
  socket,
  sessionCode,
  participantName,
  participantId,
  votedQuestions,
  onVote,
  onRemoveVote,
}) {
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const text = questionText.trim();
    if (!text || !socket) return;

    setSubmitting(true);
    socket.emit('submit-question', {
      text,
      authorName: participantName,
    });

    setQuestionText('');
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  function handleVote(q) {
    if (!socket) return;
    const hasVoted = votedQuestions.has(q.id);
    socket.emit('vote-question', {
      questionId: q.id,
      action: hasVoted ? 'remove' : 'add',
    });
    if (hasVoted) {
      onRemoveVote(q.id);
    } else {
      onVote(q.id);
    }
  }

  const unanswered = questions.filter(q => !q.is_answered);
  const answered   = questions.filter(q =>  q.is_answered);

  return (
    <div className="space-y-5">
      {/* Submit question form */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Ask a Question</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Type your question here…"
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            maxLength={500}
            disabled={submitting}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${questionText.length > 450 ? 'text-orange-500' : 'text-slate-400'}`}>
              {questionText.length}/500
            </span>
            <button
              type="submit"
              className="btn-primary bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 px-5 py-2"
              disabled={submitting || !questionText.trim()}
            >
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
        {submitted && (
          <p className="text-green-600 text-sm mt-2 animate-fade-in">✓ Question submitted!</p>
        )}
      </div>

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pending */}
          {unanswered.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                Questions · {unanswered.length}
              </h3>
              <div className="space-y-2.5">
                {unanswered.map(q => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    hasVoted={votedQuestions.has(q.id)}
                    onVote={handleVote}
                    isOwn={q.author_name === participantName}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Answered */}
          {answered.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 px-1">
                Answered · {answered.length}
              </h3>
              <div className="space-y-2.5">
                {answered.map(q => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    hasVoted={votedQuestions.has(q.id)}
                    onVote={handleVote}
                    isOwn={q.author_name === participantName}
                    answered
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question: q, hasVoted, onVote, isOwn, answered }) {
  return (
    <div className={`card p-4 flex gap-3 ${answered ? 'opacity-60' : ''}`}>
      {/* Vote button */}
      <button
        onClick={() => !answered && onVote(q)}
        disabled={answered}
        className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[2.5rem] rounded-xl p-2 transition ${
          answered
            ? 'bg-slate-50 cursor-default'
            : hasVoted
              ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 cursor-pointer'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 cursor-pointer active:scale-95'
        }`}
        title={hasVoted ? 'Remove vote' : 'Upvote'}
      >
        <span className="text-sm font-bold leading-none">{q.vote_count}</span>
        <span className={`text-xs mt-0.5 ${hasVoted ? 'text-purple-500' : 'text-slate-400'}`}>
          {hasVoted ? '▲' : '△'}
        </span>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-slate-800 leading-relaxed ${answered ? 'line-through text-slate-400' : ''}`}>
          {q.text}
        </p>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">{q.author_name}</span>
          {isOwn && <span className="badge bg-purple-100 text-purple-600">You</span>}
          {answered && <span className="badge bg-green-100 text-green-700">✓ Answered</span>}
        </div>
      </div>
    </div>
  );
}

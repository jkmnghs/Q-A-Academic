import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext.jsx';
import QAPanel from './QAPanel.jsx';
import PollCreator from './PollCreator.jsx';
import PollResultsView from './PollResultsView.jsx';

export default function HostDashboard({ session }) {
  const socket = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('qa');
  const [questions, setQuestions] = useState([]);
  const [polls, setPolls] = useState([]);
  const [connected, setConnected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-session', {
        code: session.code,
        role: 'host',
        participantId: `host_${session.id}`,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('session-data', (data) => {
      setQuestions(data.questions || []);
      setPolls(data.polls || []);
    });

    socket.on('new-question', (q) => {
      setQuestions(prev => sortQuestions([...prev, q]));
    });

    socket.on('question-updated', (q) => {
      setQuestions(prev => sortQuestions(prev.map(x => x.id === q.id ? q : x)));
    });

    socket.on('question-deleted', ({ questionId }) => {
      setQuestions(prev => prev.filter(x => x.id !== questionId));
    });

    socket.on('poll-created', (poll) => {
      setPolls(prev => [...prev, poll]);
    });

    socket.on('poll-activated', (poll) => {
      setPolls(prev => prev.map(p => ({
        ...p,
        is_active: p.id === poll.id ? 1 : 0,
      })).map(p => p.id === poll.id ? { ...p, ...poll } : p));
    });

    socket.on('poll-closed', ({ pollId }) => {
      setPolls(prev => prev.map(p =>
        p.id === pollId ? { ...p, is_active: 0, is_closed: 1 } : p
      ));
    });

    socket.on('poll-deleted', ({ pollId }) => {
      setPolls(prev => prev.filter(p => p.id !== pollId));
    });

    socket.on('poll-results-updated', ({ pollId, results }) => {
      setPolls(prev => prev.map(p =>
        p.id === pollId ? { ...p, results } : p
      ));
    });

    socket.on('session-ended', () => setSessionEnded(true));

    // If socket was already connected before the effect ran
    if (socket.connected) {
      setConnected(true);
      socket.emit('join-session', {
        code: session.code,
        role: 'host',
        participantId: `host_${session.id}`,
      });
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('session-data');
      socket.off('new-question');
      socket.off('question-updated');
      socket.off('question-deleted');
      socket.off('poll-created');
      socket.off('poll-activated');
      socket.off('poll-closed');
      socket.off('poll-deleted');
      socket.off('poll-results-updated');
      socket.off('session-ended');
    };
  }, [socket, session]);

  function sortQuestions(qs) {
    return [...qs].sort((a, b) => {
      if (a.is_answered !== b.is_answered) return a.is_answered - b.is_answered;
      return b.vote_count - a.vote_count || new Date(a.created_at) - new Date(b.created_at);
    });
  }

  function copyCode() {
    navigator.clipboard.writeText(session.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyLink() {
    const url = `${window.location.origin}/join?code=${session.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEndSession() {
    if (!window.confirm('End this session? Participants will be disconnected.')) return;
    socket.emit('end-session');
    sessionStorage.removeItem(`host_session_${session.code}`);
    navigate('/', { replace: true });
  }

  if (sessionEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-10 text-center max-w-sm">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-slate-900">Session Ended</h2>
          <p className="text-slate-500 mt-2 text-sm">Thanks for using LivePulse!</p>
          <button className="btn-primary mt-6" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const activePoll = polls.find(p => p.is_active);
  const unansweredCount = questions.filter(q => !q.is_answered).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💬</div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1">
                {session.title}
              </h1>
              <p className="text-xs text-slate-500">Hosted by {session.host_name}</p>
            </div>
          </div>

          {/* Join Code */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
              <span className="text-xs text-indigo-600 font-medium hidden sm:block">JOIN CODE</span>
              <span className="font-mono font-extrabold text-indigo-700 text-xl tracking-widest">
                {session.code}
              </span>
            </div>

            <button onClick={copyCode} className="btn-secondary text-xs px-3 py-2" title="Copy code">
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            <button onClick={copyLink} className="btn-secondary text-xs px-3 py-2 hidden sm:flex" title="Copy join link">
              🔗 Link
            </button>

            {/* Status indicator */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              {connected ? 'Live' : 'Connecting…'}
            </div>

            <button onClick={handleEndSession} className="btn-danger text-xs px-3 py-2 hidden sm:flex">
              End
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto w-full px-4 mt-4">
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl w-fit">
          <TabButton
            active={activeTab === 'qa'}
            onClick={() => setActiveTab('qa')}
            label={`Q&A ${unansweredCount > 0 ? `(${unansweredCount})` : ''}`}
            icon="💬"
          />
          <TabButton
            active={activeTab === 'polls'}
            onClick={() => setActiveTab('polls')}
            label={`Polls ${polls.length > 0 ? `(${polls.length})` : ''}`}
            icon="📊"
            badge={activePoll ? '●' : null}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full px-4 py-5 flex-1">
        {activeTab === 'qa' && (
          <QAPanel questions={questions} socket={socket} sessionCode={session.code} />
        )}

        {activeTab === 'polls' && (
          <div className="space-y-4">
            {/* Create poll button */}
            <button
              className="btn-primary"
              onClick={() => setShowPollCreator(true)}
            >
              + Create Poll
            </button>

            {polls.length === 0 ? (
              <div className="card p-10 text-center text-slate-400">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm">No polls yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {polls.map(poll => (
                  <PollResultsView
                    key={poll.id}
                    poll={poll}
                    socket={socket}
                    sessionCode={session.code}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Poll Creator Modal ─────────────────────────────────────────────── */}
      {showPollCreator && (
        <PollCreator
          socket={socket}
          sessionCode={session.code}
          onClose={() => setShowPollCreator(false)}
        />
      )}

      {/* Mobile End Button */}
      <div className="sm:hidden fixed bottom-4 right-4">
        <button onClick={handleEndSession} className="btn-danger shadow-lg px-4 py-2 text-sm">
          End Session
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse absolute top-1 right-1" />
      )}
    </button>
  );
}

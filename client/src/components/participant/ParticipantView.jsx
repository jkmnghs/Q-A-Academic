import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext.jsx';
import QAParticipant from './QAParticipant.jsx';
import PollParticipant from './PollParticipant.jsx';

export default function ParticipantView({ session, participantName, participantId }) {
  const socket = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('qa');
  const [questions, setQuestions] = useState([]);
  const [polls, setPolls] = useState([]);
  const [connected, setConnected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Persist voted questions across re-renders
  const [votedQuestions, setVotedQuestions] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(`votes_${session.code}`) || '[]'));
    } catch {
      return new Set();
    }
  });

  // Persist responded polls
  const [respondedPolls, setRespondedPolls] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(`polls_${session.code}`) || '[]'));
    } catch {
      return new Set();
    }
  });

  function persistVote(questionId) {
    setVotedQuestions(prev => {
      const next = new Set(prev);
      next.add(questionId);
      localStorage.setItem(`votes_${session.code}`, JSON.stringify([...next]));
      return next;
    });
  }

  function removeVote(questionId) {
    setVotedQuestions(prev => {
      const next = new Set(prev);
      next.delete(questionId);
      localStorage.setItem(`votes_${session.code}`, JSON.stringify([...next]));
      return next;
    });
  }

  function persistPollResponse(pollId) {
    setRespondedPolls(prev => {
      const next = new Set(prev);
      next.add(pollId);
      localStorage.setItem(`polls_${session.code}`, JSON.stringify([...next]));
      return next;
    });
  }

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const doJoin = () => {
      setConnected(true);
      socket.emit('join-session', {
        code: session.code,
        role: 'participant',
        participantId,
      });
    };

    socket.on('connect', doJoin);
    socket.on('disconnect', () => setConnected(false));

    socket.on('session-data', (data) => {
      setQuestions(sortQ(data.questions || []));
      setPolls(data.polls || []);
    });

    socket.on('new-question', (q) => {
      setQuestions(prev => sortQ([...prev, q]));
    });

    socket.on('question-updated', (q) => {
      setQuestions(prev => sortQ(prev.map(x => x.id === q.id ? q : x)));
    });

    socket.on('question-deleted', ({ questionId }) => {
      setQuestions(prev => prev.filter(x => x.id !== questionId));
    });

    socket.on('poll-created', (poll) => {
      setPolls(prev => [...prev, poll]);
    });

    socket.on('poll-activated', (poll) => {
      setPolls(prev => prev.map(p =>
        p.id === poll.id ? { ...p, ...poll, is_active: 1 } : { ...p, is_active: 0 }
      ));
      // Auto-switch to polls tab when a poll goes live
      setActiveTab('polls');
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

    socket.on('response-accepted', ({ pollId }) => {
      persistPollResponse(pollId);
    });

    socket.on('session-ended', () => setSessionEnded(true));

    if (socket.connected) doJoin();

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
      socket.off('response-accepted');
      socket.off('session-ended');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, session.code, participantId]);

  if (sessionEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-10 text-center max-w-sm">
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-xl font-bold text-slate-900">Session Ended</h2>
          <p className="text-slate-500 mt-2 text-sm">The host has ended this session. Thanks for participating!</p>
          <button className="btn-primary mt-6 bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const activePoll = polls.find(p => p.is_active);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl">💬</div>
            <div>
              <h1 className="font-bold text-slate-900 text-base line-clamp-1">{session.title}</h1>
              <p className="text-xs text-slate-400">{participantName}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto w-full px-4 mt-4">
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl w-fit">
          <TabBtn active={activeTab === 'qa'} onClick={() => setActiveTab('qa')} label="Q&A" icon="💬" />
          <TabBtn
            active={activeTab === 'polls'}
            onClick={() => setActiveTab('polls')}
            label={`Polls${activePoll ? ' ●' : ''}`}
            icon="📊"
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto w-full px-4 py-5 flex-1">
        {activeTab === 'qa' && (
          <QAParticipant
            questions={questions}
            socket={socket}
            sessionCode={session.code}
            participantName={participantName}
            participantId={participantId}
            votedQuestions={votedQuestions}
            onVote={persistVote}
            onRemoveVote={removeVote}
          />
        )}

        {activeTab === 'polls' && (
          <div className="space-y-4">
            {polls.length === 0 && (
              <div className="card p-12 text-center text-slate-400">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm">No polls yet. Check back soon!</p>
              </div>
            )}
            {polls.map(poll => (
              <PollParticipant
                key={poll.id}
                poll={poll}
                socket={socket}
                participantId={participantId}
                hasResponded={respondedPolls.has(poll.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function sortQ(qs) {
  return [...qs].sort((a, b) => b.vote_count - a.vote_count || new Date(a.created_at) - new Date(b.created_at));
}

function TabBtn({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        active ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { SocketProvider } from '../context/SocketContext.jsx';
import ParticipantView from '../components/participant/ParticipantView.jsx';

function getParticipantId() {
  let id = localStorage.getItem('participantId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('participantId', id);
  }
  return id;
}

export default function ParticipantPage() {
  const { code: urlCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState('join'); // 'join' | 'participate'
  const [session, setSession] = useState(null);
  const [participantName, setParticipantName] = useState('');
  const [form, setForm] = useState({ code: urlCode || '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const participantId = getParticipantId();

  // Auto-join if code is in the URL
  useEffect(() => {
    if (urlCode) {
      setForm(f => ({ ...f, code: urlCode }));
    }
  }, [urlCode]);

  async function handleJoin(e) {
    e.preventDefault();
    const code = form.code.toUpperCase().trim();
    const name = form.name.trim();
    if (!code || !name) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`/api/sessions/${code}`);
      setSession(data);
      setParticipantName(name);
      setStep('participate');
      navigate(`/participate/${code}`, { replace: true });
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Session not found. Check the code and try again.');
      } else {
        setError('Could not join session. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === 'participate' && session) {
    return (
      <SocketProvider>
        <ParticipantView
          session={session}
          participantName={participantName}
          participantId={participantId}
        />
      </SocketProvider>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md animate-slide-up">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          ← Back
        </button>

        <div className="card p-8">
          <div className="mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl mb-3">
              🙋
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Join a Session</h1>
            <p className="text-slate-500 text-sm mt-1">
              Enter the 6-character code shared by your host.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Session Code
              </label>
              <input
                className="input tracking-widest uppercase font-mono text-center text-lg"
                placeholder="ABC123"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your Name
              </label>
              <input
                className="input"
                placeholder="e.g. Alex Johnson"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                maxLength={60}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full py-3 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500" disabled={loading}>
              {loading ? 'Joining…' : 'Join Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

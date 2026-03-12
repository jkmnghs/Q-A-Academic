import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SocketProvider } from '../context/SocketContext.jsx';
import HostDashboard from '../components/host/HostDashboard.jsx';

export default function HostPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState('create'); // 'create' | 'dashboard'
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({ title: '', hostName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If a code is in the URL, skip straight to the dashboard
  useEffect(() => {
    if (code) {
      // Try to recover session from sessionStorage
      const stored = sessionStorage.getItem(`host_session_${code}`);
      if (stored) {
        setSession(JSON.parse(stored));
        setStep('dashboard');
      } else {
        navigate('/host', { replace: true });
      }
    }
  }, [code, navigate]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.hostName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/sessions', {
        title: form.title.trim(),
        hostName: form.hostName.trim(),
      });
      sessionStorage.setItem(`host_session_${data.code}`, JSON.stringify(data));
      setSession(data);
      setStep('dashboard');
      navigate(`/host/${data.code}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'dashboard' && session) {
    return (
      <SocketProvider>
        <HostDashboard session={session} />
      </SocketProvider>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          ← Back
        </button>

        <div className="card p-8">
          <div className="mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl mb-3">
              🎤
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Host a Session</h1>
            <p className="text-slate-500 text-sm mt-1">
              Create your session and get a shareable join code.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your Name
              </label>
              <input
                className="input"
                placeholder="e.g. Jane Smith"
                value={form.hostName}
                onChange={e => setForm(f => ({ ...f, hostName: e.target.value }))}
                required
                maxLength={60}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Session Title
              </label>
              <input
                className="input"
                placeholder="e.g. Q3 Town Hall"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                maxLength={100}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Creating…' : 'Create Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

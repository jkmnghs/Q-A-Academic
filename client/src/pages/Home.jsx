import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      {/* Logo / Brand */}
      <div className="mb-10 text-center animate-fade-in">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg text-3xl">
          💬
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">LivePulse</h1>
        <p className="mt-2 text-slate-500 text-base max-w-xs mx-auto">
          Real-time Q&amp;A and polls for engaging presentations
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid gap-5 w-full max-w-sm animate-slide-up">
        {/* Host Card */}
        <button
          onClick={() => navigate('/host')}
          className="card p-6 text-left hover:shadow-md hover:border-indigo-200 transition-all group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl group-hover:bg-indigo-200 transition-colors">
              🎤
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Host a Session</h2>
              <p className="text-sm text-slate-500 mt-1">
                Create Q&amp;A boards and live polls. Share a code with your audience.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="btn-primary text-xs px-4 py-2">Create Session →</span>
          </div>
        </button>

        {/* Participant Card */}
        <button
          onClick={() => navigate('/join')}
          className="card p-6 text-left hover:shadow-md hover:border-purple-200 transition-all group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-colors">
              🙋
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Join a Session</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter a code to join a session. Ask questions and vote on polls.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 group-hover:bg-purple-100 transition-colors">
              Join Session →
            </span>
          </div>
        </button>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        No account needed · Real-time · Free
      </p>
    </div>
  );
}

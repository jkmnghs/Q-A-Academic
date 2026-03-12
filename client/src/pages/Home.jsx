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

      {/* Footer */}
      <footer className="mt-8 flex flex-col items-center gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/jkmnghs/Q-A-Academic"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-600 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
        <p>© {new Date().getFullYear()} LivePulse. All rights reserved.</p>
      </footer>
    </div>
  );
}

import { useState } from 'react';

export default function PollCreator({ socket, sessionCode, onClose }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('multiple_choice');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  function addOption() {
    if (options.length >= 8) return;
    setOptions(prev => [...prev, '']);
  }

  function updateOption(idx, val) {
    setOptions(prev => prev.map((o, i) => i === idx ? val : o));
  }

  function removeOption(idx) {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    if (type === 'multiple_choice') {
      const validOptions = options.filter(o => o.trim());
      if (validOptions.length < 2) return;
    }

    setCreating(true);
    socket?.emit('create-poll', {
      title: title.trim(),
      type,
      options: type === 'multiple_choice' ? options.filter(o => o.trim()) : [],
    });
    onClose();
  }

  const TYPES = [
    { key: 'multiple_choice', label: 'Multiple Choice', icon: '☑️', desc: 'Let participants pick one option' },
    { key: 'word_cloud',      label: 'Word Cloud',      icon: '☁️', desc: 'Collect free-text responses' },
    { key: 'rating',          label: 'Rating Scale',    icon: '⭐', desc: '1–10 rating scale' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Create Poll</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Question / Title</label>
              <input
                className="input"
                placeholder="e.g. How are you feeling today?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={200}
                autoFocus
              />
            </div>

            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Poll Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TYPES.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setType(t.key)}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      type === t.key
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{t.icon}</div>
                    <div className="text-xs font-semibold text-slate-800">{t.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Multiple choice options */}
            {type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Answer Options
                </label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className="input flex-1"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={e => updateOption(idx, e.target.value)}
                        maxLength={100}
                        required={idx < 2}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-slate-400 hover:text-red-500 transition text-lg leading-none flex-shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 8 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              </div>
            )}

            {type === 'word_cloud' && (
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                ☁️ Participants will type a short response. Responses are displayed as a word cloud sized by frequency.
              </div>
            )}

            {type === 'rating' && (
              <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700">
                ⭐ Participants choose a rating from 1 (low) to 10 (high). Results show the average and distribution.
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating…' : 'Create Poll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

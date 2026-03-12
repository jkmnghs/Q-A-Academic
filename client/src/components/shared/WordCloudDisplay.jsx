import { useMemo } from 'react';

const COLORS = [
  'text-indigo-600',
  'text-purple-600',
  'text-blue-500',
  'text-pink-500',
  'text-violet-600',
  'text-cyan-600',
  'text-fuchsia-500',
  'text-sky-500',
];

export default function WordCloudDisplay({ words }) {
  const maxCount = useMemo(() => Math.max(...words.map(w => w.count), 1), [words]);

  // Shuffle once on render so layout feels organic
  const shuffled = useMemo(
    () => [...words].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words.length]
  );

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
        No responses yet
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center py-4 px-2 min-h-[8rem]">
      {shuffled.map((word, idx) => {
        const ratio = word.count / maxCount;
        const sizeClass =
          ratio > 0.8 ? 'text-4xl font-extrabold' :
          ratio > 0.6 ? 'text-3xl font-bold' :
          ratio > 0.4 ? 'text-2xl font-semibold' :
          ratio > 0.2 ? 'text-xl font-medium' :
                        'text-base';

        const color = COLORS[idx % COLORS.length];

        return (
          <span
            key={word.text}
            className={`${sizeClass} ${color} leading-tight transition-all duration-300 cursor-default select-none`}
            title={`${word.text}: ${word.count}`}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}

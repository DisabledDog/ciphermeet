'use client';

import { useRoomStore } from '@/store/useRoomStore';

const shortcuts = [
  { key: 'M', desc: 'Toggle microphone' },
  { key: 'V', desc: 'Toggle camera' },
  { key: 'H', desc: 'Raise / lower hand' },
  { key: 'R', desc: 'Open reactions' },
  { key: 'Esc', desc: 'Leave call' },
];

export function HelpModal() {
  const toggleHelp = useRoomStore((s) => s.toggleHelp);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={toggleHelp} />
      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-2xl" />
        <div className="relative bg-black rounded-2xl p-6 space-y-5">
          {/* Close */}
          <button onClick={toggleHelp} className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div>
            <h2 className="text-lg font-light text-white/90 tracking-wide">Keyboard Shortcuts</h2>
            <p className="text-white/25 text-xs font-light mt-1">Quick controls during your call</p>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Shortcuts list */}
          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="text-white/50 text-sm font-light">{s.desc}</span>
                <kbd className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/60 text-xs font-mono tracking-wider">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/25">
              <svg className="w-3.5 h-3.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[10px] tracking-[0.2em] uppercase">End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-white/25">
              <svg className="w-3.5 h-3.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="text-[10px] tracking-[0.2em] uppercase">This call is not recorded</span>
            </div>
            <div className="flex items-center gap-2 text-white/25">
              <svg className="w-3.5 h-3.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-[10px] tracking-[0.2em] uppercase">All data destroyed when call ends</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

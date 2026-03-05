'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InteractiveSky } from '@/components/InteractiveSky';

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 250);
  const heroScale = 1 + scrollY * 0.0005;
  const contentOpacity = Math.min(1, Math.max(0, (scrollY - 80) / 180));
  const contentScale = Math.min(1, 0.92 + (scrollY - 80) * 0.0005);
  // Horizontal line wipe progress (0 to 1)
  const wipeProgress = Math.min(1, Math.max(0, (scrollY - 40) / 120));

  const handleHost = () => router.push('/host');

  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) return;
    const match = code.match(/\/room\/([a-z0-9-]+)/i);
    const roomId = match ? match[1] : code;
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="bg-black text-white min-h-[160vh]">
      {/* Hero Section with Interactive Sky */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale})`,
          transition: 'opacity 0.1s ease-out',
        }}
      >
        <InteractiveSky />

        {/* Subtle scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-x-0 h-[1px] bg-white/[0.02]"
            style={{ animation: 'scan 6s linear infinite' }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 pointer-events-none">
          {mounted && (
            <>
              <div className="animate-fade-in-up mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span className="text-white/60 text-xs tracking-[0.2em] uppercase font-light">Encrypted. Anonymous. Ephemeral.</span>
                </div>
              </div>

              <h1 className="animate-fade-in-up-delay-1 text-7xl sm:text-9xl font-bold tracking-tighter mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30">
                  CIPHER
                </span>
                <span className="text-white/15">MEET</span>
              </h1>

              <p className="animate-fade-in-up-delay-2 text-white/30 text-lg tracking-wide font-light max-w-md mx-auto">
                Video calls that leave no trace.
              </p>

              <div className="animate-fade-in-up-delay-3 mt-14">
                <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' })}>
                  <span className="text-white/40 text-xs tracking-[0.25em] uppercase font-light">Scroll to begin</span>
                  <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-scroll-dot" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-[60vh]" />

      {/* Horizontal light wipe transition */}
      <div className="relative z-20 h-20 flex items-center justify-center pointer-events-none">
        <div
          className="h-[1px] transition-none"
          style={{
            width: `${wipeProgress * 100}%`,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.4 * wipeProgress}), transparent)`,
            boxShadow: wipeProgress > 0.1 ? `0 0 ${20 * wipeProgress}px rgba(255,255,255,${0.15 * wipeProgress}), 0 0 ${60 * wipeProgress}px rgba(255,255,255,${0.05 * wipeProgress})` : 'none',
          }}
        />
      </div>

      {/* Main content */}
      <div
        className="relative z-20 min-h-screen flex items-center justify-center px-4 py-12"
        style={{
          opacity: contentOpacity,
          transform: `scale(${contentScale})`,
        }}
      >
        <div className="w-full max-w-lg space-y-10">
          {/* Glowing border card */}
          <div className="relative group">
            <div
              className="absolute -inset-[1px] rounded-2xl"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
                opacity: contentOpacity,
              }}
            />

            <div className="relative bg-black/90 backdrop-blur-sm rounded-2xl p-8 space-y-8">
              <div className="space-y-4">
                <button
                  onClick={handleHost}
                  className="group w-full py-4 bg-white text-black text-base font-semibold rounded-xl transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Host a Room
                  </span>
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/20 text-xs tracking-[0.15em] uppercase">or join</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Room code or link"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleJoin();
                    }}
                    className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors font-mono text-sm"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!joinCode.trim()}
                    className="px-6 py-3.5 border border-white/20 hover:bg-white/10 disabled:border-white/5 disabled:text-white/20 text-white text-sm font-medium rounded-xl transition-all"
                  >
                    Enter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent mx-auto" />
              <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase">No accounts</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent mx-auto" />
              <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase">No data stored</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent mx-auto" />
              <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase">No trace</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

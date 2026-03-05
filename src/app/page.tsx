'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
      {/* Radial fade */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, black 70%)',
      }} />
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/10 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

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

  const heroOpacity = Math.max(0, 1 - scrollY / 400);
  const contentOpacity = Math.min(1, Math.max(0, (scrollY - 200) / 300));

  const handleHost = () => router.push('/host');

  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) return;
    const match = code.match(/\/room\/([a-z0-9-]+)/i);
    const roomId = match ? match[1] : code;
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="bg-black text-white min-h-[200vh]">
      {/* Hero Section - Video-like background */}
      <div
        className="fixed inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: heroOpacity }}
      >
        <GridBackground />
        <FloatingParticles />

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-x-0 h-[2px] bg-white/5"
            style={{ animation: 'scan 4s linear infinite' }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4">
          {mounted && (
            <>
              <div className="animate-fade-in-up mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span className="text-white/60 text-xs tracking-[0.2em] uppercase font-light">Encrypted. Anonymous. Ephemeral.</span>
                </div>
              </div>

              <h1 className="animate-fade-in-up-delay-1 text-7xl sm:text-8xl font-bold tracking-tighter mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                  CIPHER
                </span>
                <span className="text-white/20">MEET</span>
              </h1>

              <p className="animate-fade-in-up-delay-2 text-white/30 text-lg tracking-wide font-light max-w-md mx-auto">
                Video calls that leave no trace.
              </p>

              <div className="animate-fade-in-up-delay-3 mt-12">
                <svg className="w-6 h-6 mx-auto text-white/20 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Spacer for scroll */}
      <div className="h-screen" />

      {/* Main content - fades in on scroll */}
      <div
        className="relative z-20 min-h-screen flex items-center justify-center px-4 py-20"
        style={{ opacity: contentOpacity }}
      >
        <div className="w-full max-w-lg space-y-10">
          {/* Glowing border card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-2xl" />

            <div className="relative bg-black rounded-2xl p-8 space-y-8">
              {/* Actions */}
              <div className="space-y-4">
                <button
                  onClick={handleHost}
                  className="group w-full py-4 bg-white text-black text-base font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Host a Room
                  </span>
                </button>

                <button
                  onClick={handleHost}
                  className="hidden"
                />

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/20 text-xs tracking-[0.15em] uppercase">or join</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Join input */}
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

          {/* Features - minimal */}
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

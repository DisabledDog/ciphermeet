'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const InteractiveSky = dynamic(() => import('@/components/InteractiveSky').then(m => ({ default: m.InteractiveSky })), { ssr: false });

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef(0);
  const animatingRef = useRef(false);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const startValueRef = useRef(0);
  const targetRef = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  function animateTo(target: number) {
    if (animatingRef.current) return;
    if (Math.abs(progressRef.current - target) < 0.05) return;

    animatingRef.current = true;
    startTimeRef.current = performance.now();
    startValueRef.current = progressRef.current;
    targetRef.current = target;

    const duration = 600;

    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const raw = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(raw);
      const val = startValueRef.current + (targetRef.current - startValueRef.current) * eased;

      progressRef.current = val;
      setProgress(val);

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        animatingRef.current = false;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  // Scroll wheel trigger
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (animatingRef.current) return;
      if (e.deltaY > 5 && progressRef.current < 0.1) animateTo(1);
      if (e.deltaY < -5 && progressRef.current > 0.9) animateTo(0);
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Derived values
  const warpActive = progress > 0.05;
  const heroFade = 1 - easeInOutCubic(Math.min(1, progress / 0.4));
  const heroScale = 1 + easeOutExpo(Math.min(1, progress / 0.5)) * 0.15;

  const wipeIn = easeOutExpo(Math.min(1, Math.max(0, (progress - 0.15) / 0.3)));
  const wipeFade = progress > 0.55 ? 1 - easeInOutCubic(Math.min(1, (progress - 0.55) / 0.2)) : 1;

  const contentRaw = Math.min(1, Math.max(0, (progress - 0.35) / 0.65));
  const contentOpacity = easeOutExpo(contentRaw);
  const contentScale = 0.88 + easeOutExpo(contentRaw) * 0.12;
  const contentBlur = Math.max(0, (1 - contentRaw) * 10);

  const bloomRaw = Math.min(1, Math.max(0, (progress - 0.3) / 0.15));
  const bloomSize = easeOutExpo(bloomRaw) * 700;
  const bloomAlpha = progress > 0.3 && progress < 0.55 ? 0.1 * (1 - Math.max(0, (progress - 0.45) / 0.1)) : 0;

  const showHero = heroFade > 0.01;
  const showContent = contentOpacity > 0.01;

  const handleHost = () => router.push('/host');
  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) return;
    const match = code.match(/\/room\/([a-z0-9-]+)/i);
    const roomId = match ? match[1] : code;
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="bg-black text-white h-screen overflow-hidden relative">
      {/* Sky - always behind, no pointer events */}
      <div className="fixed inset-0 z-0">
        <InteractiveSky warp={warpActive} />
      </div>

      {/* Hero */}
      {showHero && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center"
          style={{ opacity: heroFade, transform: `scale(${heroScale})`, pointerEvents: heroFade > 0.5 ? 'auto' : 'none' }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-x-0 h-[1px] bg-white/[0.02]" style={{ animation: 'scan 6s linear infinite' }} />
          </div>

          <div className="relative z-10 text-center px-4">
            {mounted && (
              <>
                <div className="animate-fade-in-up mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-white/60 text-xs tracking-[0.2em] uppercase font-light">Encrypted. Anonymous. Ephemeral.</span>
                  </div>
                </div>

                <h1 className="animate-fade-in-up-delay-1 text-7xl sm:text-9xl font-bold tracking-tighter mb-4">
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30">CIPHER</span>
                  <span className="text-white/15">MEET</span>
                </h1>

                <p className="animate-fade-in-up-delay-2 text-white/30 text-lg tracking-wide font-light max-w-md mx-auto">
                  Video calls that leave no trace.
                </p>

                <div className="animate-fade-in-up-delay-3 mt-14 flex flex-col items-center gap-5">
                  <div className="cursor-pointer" onClick={() => animateTo(1)}>
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-scroll-dot" />
                    </div>
                  </div>
                  <button
                    onClick={() => animateTo(1)}
                    className="px-8 py-2.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm text-white/50 text-xs tracking-[0.2em] uppercase font-light hover:bg-white/10 hover:border-white/25 hover:text-white/70 transition-all"
                  >
                    Get Started
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Light wipe */}
      {wipeIn > 0 && wipeFade > 0.01 && (
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ opacity: wipeFade }}>
          <div
            className="absolute h-[2px]"
            style={{
              width: `${wipeIn * 100}%`,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${0.7 * wipeIn}) 50%, transparent 100%)`,
              boxShadow: `0 0 ${40 * wipeIn}px rgba(255,255,255,${0.3 * wipeIn}), 0 0 ${100 * wipeIn}px rgba(255,255,255,${0.1 * wipeIn})`,
            }}
          />
          {bloomSize > 10 && bloomAlpha > 0.005 && (
            <div
              className="absolute rounded-full"
              style={{
                width: bloomSize, height: bloomSize,
                background: `radial-gradient(circle, rgba(255,255,255,${bloomAlpha}) 0%, transparent 70%)`,
              }}
            />
          )}
        </div>
      )}

      {/* Content */}
      {showContent && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center px-4"
          style={{
            opacity: contentOpacity,
            transform: `scale(${contentScale})`,
            filter: contentBlur > 0.5 ? `blur(${contentBlur}px)` : 'none',
            pointerEvents: contentOpacity > 0.5 ? 'auto' : 'none',
          }}
        >
          <div className="w-full max-w-lg space-y-8">
            <button
              onClick={() => animateTo(0)}
              className="flex items-center gap-2 text-white/20 hover:text-white/50 transition-colors text-xs tracking-[0.15em] uppercase group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="relative group">
              <div className="absolute -inset-[1px] rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)' }} />
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
                      onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
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
      )}

      {/* Donation link */}
      <a
        href="https://buymeacoffee.com/ciphermeet"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-black/50 backdrop-blur-sm text-white/30 hover:text-white/60 hover:border-white/20 transition-all text-[10px] tracking-wider uppercase"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        Donate
      </a>
    </div>
  );
}

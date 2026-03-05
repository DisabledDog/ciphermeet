'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, black 70%)',
      }} />

      <div className="relative z-10 text-center space-y-6 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-white/10 bg-white/5 mb-2">
          <span className="text-3xl font-light text-white/40">?</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tighter text-white/90">404</h1>
          <p className="text-white/30 text-sm font-light tracking-wide">
            This page doesn't exist. Just like your data on our servers.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 bg-white text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Go Home
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-3 border border-white/15 text-white/50 font-light rounded-xl transition-all hover:bg-white/5 hover:text-white/70 text-sm"
          >
            Go Back
          </button>
        </div>

        <p className="text-white/10 text-[10px] tracking-[0.3em] uppercase pt-4">
          CipherMeet
        </p>
      </div>
    </div>
  );
}

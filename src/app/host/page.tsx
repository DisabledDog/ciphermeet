'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket, disconnectSocket } from '@/lib/socket';

export default function HostPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async () => {
    setCreating(true);
    setError(null);

    try {
      const socket = getSocket();
      socket.connect();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timed out')), 10000);
        socket.once('connect', () => { clearTimeout(timeout); resolve(); });
        socket.once('connect_error', () => { clearTimeout(timeout); reject(new Error('Could not connect to server')); });
        if (socket.connected) { clearTimeout(timeout); resolve(); }
      });

      const result = await new Promise<{ roomId?: string; error?: string }>((resolve) => {
        socket.emit('create-room', { password: usePassword ? password : undefined }, resolve);
      });

      socket.removeAllListeners();
      disconnectSocket();

      if (result.error) {
        setError(result.error);
        setCreating(false);
        return;
      }

      setRoomId(result.roomId!);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    }
    setCreating(false);
  };

  const roomLink = roomId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinAsHost = () => {
    if (!roomId) return;
    router.push(`/room/${roomId}${usePassword && password ? `?p=${encodeURIComponent(password)}` : ''}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, black 70%)',
      }} />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white/25 hover:text-white/60 transition-colors text-xs tracking-[0.15em] uppercase group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {!roomId ? (
          <>
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-white/10 bg-white/5 mb-2">
                <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h1 className="text-2xl font-light text-white/90 tracking-wide">Create a Room</h1>
              <p className="text-white/25 text-sm font-light">Set up a private, encrypted space</p>
            </div>

            {/* Card */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-2xl" />
              <div className="relative bg-black rounded-2xl p-6 space-y-5">
                {/* Room name display */}
                <div className="text-center py-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-pulse" />
                    <span className="text-white/40 text-xs tracking-wider uppercase">Room will be generated</span>
                  </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Password section */}
                <div className="space-y-3">
                  <div
                    onClick={() => setUsePassword(!usePassword)}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-white/60 text-sm font-light">Password protect</span>
                    </div>
                    <div className={`w-10 h-5.5 rounded-full transition-colors relative ${usePassword ? 'bg-white' : 'bg-white/10'}`}>
                      <div className={`w-4.5 h-4.5 rounded-full absolute top-[2px] transition-all duration-200 ${
                        usePassword ? 'translate-x-[18px] bg-black' : 'translate-x-[2px] bg-white/30'
                      }`} />
                    </div>
                  </div>

                  {usePassword && (
                    <input
                      type="text"
                      placeholder="Enter a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all font-mono text-sm animate-fade-in-up"
                      autoFocus
                    />
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 text-red-400/80 px-4 py-2.5 rounded-xl text-sm font-light">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  onClick={createRoom}
                  disabled={creating || (usePassword && !password.trim())}
                  className="w-full py-3.5 bg-white text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </button>
              </div>
            </div>

            {/* Info footer */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-white/15 text-[10px] tracking-wider uppercase">Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white/15 text-[10px] tracking-wider uppercase">Up to 30</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-white/15 text-[10px] tracking-wider uppercase">Instant</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Room Created - Success */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-white/10 bg-white/5 mb-2">
                <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-light text-white/90 tracking-wide">Room Ready</h1>
              <p className="text-white/25 text-sm font-light">Share the link or code to invite others</p>
            </div>

            <div className="space-y-4 animate-fade-in-up">
              {/* Room code - big and prominent */}
              <div className="relative">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-2xl" />
                <div className="relative bg-black rounded-2xl p-6 text-center">
                  <p className="text-white/25 text-[10px] uppercase tracking-[0.25em] mb-4">Your Room Code</p>
                  <p className="text-4xl font-mono font-bold text-white tracking-[0.1em] mb-1">{roomId}</p>
                  <p className="text-white/15 text-[10px] tracking-wider">Share this code with participants</p>
                </div>
              </div>

              {/* Invite link */}
              <div className="relative">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-2xl" />
                <div className="relative bg-black rounded-2xl p-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-3">Invite Link</p>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/40 text-xs truncate font-mono flex items-center">
                      {roomLink}
                    </div>
                    <button
                      onClick={copyLink}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        copied
                          ? 'bg-white text-black'
                          : 'border border-white/15 hover:bg-white/10 text-white/60'
                      }`}
                    >
                      {copied ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password badge */}
              {usePassword && password && (
                <div className="flex items-center gap-2.5 px-4 py-3 border border-white/10 bg-white/[0.02] rounded-xl">
                  <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-white/40 text-sm font-light">
                    Password: <span className="font-mono text-white/60">{password}</span>
                  </span>
                </div>
              )}

              {/* Join button */}
              <button
                onClick={joinAsHost}
                className="w-full py-4 bg-white text-black text-base font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join Your Room
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

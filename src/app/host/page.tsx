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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm tracking-wide"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light text-white/90 tracking-wide">Host a Room</h1>
          <p className="text-white/30 text-sm font-light tracking-wide">Set up your room and share the link</p>
        </div>

        {!roomId ? (
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-2xl" />
            <div className="relative bg-black rounded-2xl p-6 space-y-6">
              {/* Password toggle */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setUsePassword(!usePassword)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${usePassword ? 'bg-white' : 'bg-white/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-transform ${
                      usePassword ? 'translate-x-[22px] bg-black' : 'translate-x-0.5 bg-white/40'
                    }`} />
                  </div>
                  <span className="text-white/70 text-sm font-light tracking-wide">Require password to join</span>
                </label>

                {usePassword && (
                  <input
                    type="text"
                    placeholder="Set a room password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                    autoFocus
                  />
                )}
              </div>

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 text-red-400/80 px-4 py-2.5 rounded-xl text-sm font-light">
                  {error}
                </div>
              )}

              <button
                onClick={createRoom}
                disabled={creating || (usePassword && !password.trim())}
                className="group w-full py-3.5 bg-white text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none disabled:scale-100"
              >
                {creating ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-2xl" />
              <div className="relative bg-black rounded-2xl p-6 space-y-6">
                {/* Room code */}
                <div className="text-center">
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-3">Room Code</p>
                  <p className="text-3xl font-mono font-bold text-white tracking-wider">{roomId}</p>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Shareable link */}
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-2">Invite Link</p>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm truncate font-mono">
                      {roomLink}
                    </div>
                    <button
                      onClick={copyLink}
                      className={`px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                        copied
                          ? 'bg-white text-black'
                          : 'border border-white/20 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Password info */}
                {usePassword && password && (
                  <div className="flex items-center gap-2.5 px-4 py-3 border border-white/10 bg-white/5 rounded-xl">
                    <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-white/50 text-sm font-light">
                      Password: <span className="font-mono text-white/70">{password}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={joinAsHost}
              className="group w-full py-4 bg-white text-black text-base font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Join Your Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

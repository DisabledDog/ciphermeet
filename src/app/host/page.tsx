'use client';

import { useState, useEffect } from 'react';
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

      // Disconnect — we'll reconnect when joining the room
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
    // Pass password in URL state so the pre-join screen can use it
    router.push(`/room/${roomId}${usePassword && password ? `?p=${encodeURIComponent(password)}` : ''}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Host a Room</h1>
          <p className="text-gray-400">Set up your room and share the link with participants</p>
        </div>

        {!roomId ? (
          /* Setup phase */
          <div className="space-y-6 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            {/* Password toggle */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setUsePassword(!usePassword)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${usePassword ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${usePassword ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-white text-sm font-medium">Require password to join</span>
              </label>

              {usePassword && (
                <input
                  type="text"
                  placeholder="Set a room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  autoFocus
                />
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={createRoom}
              disabled={creating || (usePassword && !password.trim())}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all"
            >
              {creating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        ) : (
          /* Room created — share phase */
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
              {/* Room code */}
              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Room Code</p>
                <p className="text-3xl font-mono font-bold text-white tracking-wider">{roomId}</p>
              </div>

              {/* Shareable link */}
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Invite Link</p>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 text-sm truncate font-mono">
                    {roomLink}
                  </div>
                  <button
                    onClick={copyLink}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Password info */}
              {usePassword && password && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-900/20 border border-blue-800/30 rounded-xl">
                  <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-blue-300 text-sm">
                    Password: <span className="font-mono font-medium">{password}</span>
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={joinAsHost}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/20"
            >
              Join Your Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

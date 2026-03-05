'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  const handleHost = () => {
    router.push('/host');
  };

  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) return;
    // Support both full URLs and just codes
    const match = code.match(/\/room\/([a-z0-9-]+)/i);
    const roomId = match ? match[1] : code;
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-lg space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-800/50 text-green-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            No accounts. No tracking. No data stored.
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            CipherMeet
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            Private video chat that disappears. Create a room, share the link, talk freely.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          {/* Host */}
          <button
            onClick={handleHost}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/20"
          >
            Host a Room
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gray-950 text-gray-500 text-sm">or join an existing room</span>
            </div>
          </div>

          {/* Join */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter room code or link"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
              className="flex-1 px-4 py-3.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim()}
              className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white font-medium rounded-xl transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 pt-2">
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">No sign-up</p>
          </div>
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Password protect</p>
          </div>
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Up to 30 people</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomId = crypto.randomUUID();
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-lg p-8 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 border border-green-800/50 text-green-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            No accounts. No tracking. No data stored.
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            CipherMeet
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Create a room, share the link, talk freely. Nothing is recorded or stored. When the call ends, it's gone.
          </p>
        </div>

        {/* Create Room */}
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl transition-colors"
          >
            Create a Room
          </button>
          <p className="text-center text-gray-500 text-sm">
            You'll get a shareable link to invite up to 30 people
          </p>
        </div>

        {/* Privacy features */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">No sign-up required</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Nothing is stored</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Up to 30 people</p>
          </div>
        </div>
      </div>
    </div>
  );
}

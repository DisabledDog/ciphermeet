'use client';

import { RemotePeer } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';

interface ParticipantSidebarProps {
  peers: Map<string, RemotePeer>;
  localDisplayName: string;
  isLocalAudioEnabled: boolean;
  isLocalVideoEnabled: boolean;
}

export function ParticipantSidebar({
  peers,
  localDisplayName,
  isLocalAudioEnabled,
  isLocalVideoEnabled,
}: ParticipantSidebarProps) {
  const toggleParticipants = useRoomStore((s) => s.toggleParticipants);
  const peerArray = Array.from(peers.values());

  return (
    <div className="w-72 bg-black border-l border-white/10 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white/80 font-light tracking-wide text-sm uppercase">
          Participants
          <span className="ml-2 text-white/30">{1 + peerArray.length}</span>
        </h2>
        <button
          onClick={toggleParticipants}
          className="text-white/30 hover:text-white/70 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Local participant */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm font-light text-white/60">
            {localDisplayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm truncate font-light">{localDisplayName} <span className="text-white/30">(You)</span></p>
          </div>
          <div className="flex gap-1.5">
            {!isLocalAudioEnabled && (
              <span className="text-red-400/70" title="Muted">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
                </svg>
              </span>
            )}
            {!isLocalVideoEnabled && (
              <span className="text-red-400/70" title="Camera off">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Remote participants */}
        {peerArray.map((peer) => (
          <div
            key={peer.peerId}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-sm font-light text-white/40">
              {peer.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-sm truncate font-light">{peer.displayName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

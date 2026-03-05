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
    <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-white font-medium">
          Participants ({1 + peerArray.length})
        </h2>
        <button
          onClick={toggleParticipants}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Local participant */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
            {localDisplayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{localDisplayName} (You)</p>
          </div>
          <div className="flex gap-1">
            {!isLocalAudioEnabled && (
              <span className="text-red-400" title="Muted">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.63 3.63a.75.75 0 010-1.06.75.75 0 011.06 0l16.38 16.38a.75.75 0 11-1.06 1.06L3.63 3.63z" />
                </svg>
              </span>
            )}
            {!isLocalVideoEnabled && (
              <span className="text-red-400" title="Camera off">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18z" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Remote participants */}
        {peerArray.map((peer) => (
          <div
            key={peer.peerId}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800"
          >
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium text-white">
              {peer.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{peer.displayName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

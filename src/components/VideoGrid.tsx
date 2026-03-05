'use client';

import { RemotePeer } from '@/types';
import { VideoTile } from './VideoTile';

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: Map<string, RemotePeer>;
  displayName: string;
  isVideoEnabled: boolean;
}

function getGridCols(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count <= 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
}

export function VideoGrid({ localStream, peers, displayName, isVideoEnabled }: VideoGridProps) {
  const peerArray = Array.from(peers.values());
  const totalParticipants = 1 + peerArray.length; // local + remote
  const gridCols = getGridCols(totalParticipants);

  return (
    <div className={`flex-1 p-4 grid ${gridCols} gap-2 auto-rows-fr`}>
      {/* Local video */}
      <VideoTile
        stream={localStream}
        displayName={displayName}
        isLocal
        isVideoOff={!isVideoEnabled}
      />

      {/* Remote videos */}
      {peerArray.map((peer) => (
        <VideoTile
          key={peer.peerId}
          stream={peer.stream}
          displayName={peer.displayName}
        />
      ))}
    </div>
  );
}

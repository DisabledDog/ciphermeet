'use client';

import { RemotePeer } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';
import { VideoTile } from './VideoTile';

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: Map<string, RemotePeer>;
  displayName: string;
  isVideoEnabled: boolean;
  isHost?: boolean;
  onMutePeer?: (peerId: string) => void;
}

function getGridCols(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count <= 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
}

export function VideoGrid({ localStream, peers, displayName, isVideoEnabled, isHost, onMutePeer }: VideoGridProps) {
  const peerArray = Array.from(peers.values());
  const totalParticipants = 1 + peerArray.length;
  const gridCols = getGridCols(totalParticipants);
  const handRaised = useRoomStore((s) => s.handRaised);
  const raisedHands = useRoomStore((s) => s.raisedHands);

  return (
    <div className={`flex-1 p-1.5 sm:p-3 grid ${gridCols} gap-1.5 sm:gap-3 auto-rows-fr`}>
      <VideoTile
        stream={localStream}
        displayName={displayName}
        isLocal
        isVideoOff={!isVideoEnabled}
        handRaised={handRaised}
      />
      {peerArray.map((peer) => (
        <VideoTile
          key={peer.peerId}
          stream={peer.stream}
          displayName={peer.displayName}
          handRaised={raisedHands.has(peer.peerId)}
          canMute={isHost}
          onMute={() => onMutePeer?.(peer.peerId)}
        />
      ))}
    </div>
  );
}

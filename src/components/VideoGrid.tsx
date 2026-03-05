'use client';

import { useState, useEffect, useRef } from 'react';
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
  const handRaised = useRoomStore((s) => s.handRaised);
  const raisedHands = useRoomStore((s) => s.raisedHands);

  // Spotlight: 'local' | peerId | null
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [autoSpotlight, setAutoSpotlight] = useState<string | null>(null);
  const autoSpotlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear spotlight if the spotlighted peer left
  useEffect(() => {
    if (spotlight && spotlight !== 'local' && !peers.has(spotlight)) {
      setSpotlight(null);
    }
  }, [peers, spotlight]);

  const handleSpotlight = (id: string) => {
    setSpotlight((prev) => (prev === id ? null : id));
  };

  // Active speaker auto-spotlight (only when no manual spotlight)
  const onSpeaking = (id: string, speaking: boolean) => {
    if (spotlight) return; // Manual spotlight takes priority
    if (speaking && totalParticipants > 2) {
      if (autoSpotlightTimer.current) clearTimeout(autoSpotlightTimer.current);
      setAutoSpotlight(id);
    } else if (!speaking && autoSpotlight === id) {
      // Delay clearing to avoid flickering
      autoSpotlightTimer.current = setTimeout(() => {
        setAutoSpotlight(null);
      }, 2000);
    }
  };

  const activeSpotlight = spotlight || autoSpotlight;

  // Spotlight layout: one big tile + sidebar of small tiles
  if (activeSpotlight && totalParticipants > 2) {
    const isLocalSpotlit = activeSpotlight === 'local';

    const smallTiles = [];

    // Add local to small tiles if not spotlit
    if (!isLocalSpotlit) {
      smallTiles.push(
        <VideoTile
          key="local"
          stream={localStream}
          displayName={displayName}
          isLocal
          isVideoOff={!isVideoEnabled}
          handRaised={handRaised}
          onSpotlight={() => handleSpotlight('local')}
        />
      );
    }

    for (const peer of peerArray) {
      if (peer.peerId === activeSpotlight) continue;
      smallTiles.push(
        <VideoTile
          key={peer.peerId}
          stream={peer.stream}
          displayName={peer.displayName}
          handRaised={raisedHands.has(peer.peerId)}
          canMute={isHost}
          onMute={() => onMutePeer?.(peer.peerId)}
          onSpotlight={() => handleSpotlight(peer.peerId)}
        />
      );
    }

    // Find the spotlit tile
    const spotlitPeer = !isLocalSpotlit ? peerArray.find((p) => p.peerId === activeSpotlight) : null;

    return (
      <div className="flex-1 flex flex-col sm:flex-row p-1.5 sm:p-3 gap-1.5 sm:gap-3 overflow-hidden">
        {/* Main spotlight */}
        <div className="flex-1 min-h-0">
          {isLocalSpotlit ? (
            <VideoTile
              stream={localStream}
              displayName={displayName}
              isLocal
              isVideoOff={!isVideoEnabled}
              handRaised={handRaised}
              isSpotlight
              onSpotlight={() => handleSpotlight('local')}
            />
          ) : spotlitPeer ? (
            <VideoTile
              stream={spotlitPeer.stream}
              displayName={spotlitPeer.displayName}
              handRaised={raisedHands.has(spotlitPeer.peerId)}
              canMute={isHost}
              onMute={() => onMutePeer?.(spotlitPeer.peerId)}
              isSpotlight
              onSpotlight={() => handleSpotlight(spotlitPeer.peerId)}
            />
          ) : null}
        </div>

        {/* Sidebar of small tiles */}
        {smallTiles.length > 0 && (
          <div className="flex sm:flex-col gap-1.5 sm:gap-3 sm:w-48 md:w-56 lg:w-64 overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden shrink-0">
            {smallTiles}
          </div>
        )}
      </div>
    );
  }

  // Normal grid layout
  const gridCols = getGridCols(totalParticipants);

  return (
    <div className={`flex-1 p-1.5 sm:p-3 grid ${gridCols} gap-1.5 sm:gap-3 auto-rows-fr`}>
      <VideoTile
        stream={localStream}
        displayName={displayName}
        isLocal
        isVideoOff={!isVideoEnabled}
        handRaised={handRaised}
        onSpotlight={() => handleSpotlight('local')}
      />
      {peerArray.map((peer) => (
        <VideoTile
          key={peer.peerId}
          stream={peer.stream}
          displayName={peer.displayName}
          handRaised={raisedHands.has(peer.peerId)}
          canMute={isHost}
          onMute={() => onMutePeer?.(peer.peerId)}
          onSpotlight={() => handleSpotlight(peer.peerId)}
        />
      ))}
    </div>
  );
}

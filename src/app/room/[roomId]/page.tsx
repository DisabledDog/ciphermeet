'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useRoomStore } from '@/store/useRoomStore';
import { useToastStore } from '@/store/useToastStore';
import { VideoGrid } from '@/components/VideoGrid';
import { ControlsBar } from '@/components/ControlsBar';
import { ParticipantSidebar } from '@/components/ParticipantSidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { PreJoinScreen } from '@/components/PreJoinScreen';
import { ToastContainer } from '@/components/ToastContainer';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const urlPassword = searchParams.get('p') || undefined;
  const [hasJoined, setHasJoined] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | undefined>(urlPassword);
  const { joinRoom, leaveRoom, sendChatMessage, startScreenShare, stopScreenShare } = useRoom(roomId);
  const {
    displayName,
    localStream,
    peers,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    isParticipantsOpen,
    connectionState,
    error,
  } = useRoomStore();

  const joinedRef = useRef(false);
  const prevPeersRef = useRef<Set<string>>(new Set());

  const handlePreJoin = (name: string, password?: string) => {
    useRoomStore.getState().setDisplayName(name);
    setRoomPassword(password || urlPassword);
    setHasJoined(true);
  };

  useEffect(() => {
    if (hasJoined && displayName && !joinedRef.current) {
      joinedRef.current = true;
      joinRoom(roomPassword);
    }
  }, [hasJoined, displayName, joinRoom, roomPassword]);

  // Toast on peer join/leave
  useEffect(() => {
    if (!hasJoined) return;
    const currentIds = new Set(peers.keys());
    const prevIds = prevPeersRef.current;
    const addToast = useToastStore.getState().addToast;

    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        const peer = peers.get(id);
        if (peer && peer.displayName) {
          addToast(`${peer.displayName} joined`);
        }
      }
    }
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        addToast('A participant left');
      }
    }
    prevPeersRef.current = currentIds;
  }, [peers, hasJoined]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    joinedRef.current = false;
    setHasJoined(false);
  }, [leaveRoom]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!hasJoined) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'm':
          useRoomStore.getState().toggleAudio();
          break;
        case 'v':
          useRoomStore.getState().toggleVideo();
          break;
        case 'escape':
          handleLeave();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasJoined, handleLeave]);

  if (!hasJoined) {
    return <PreJoinScreen roomId={roomId} onJoin={handlePreJoin} initialPassword={urlPassword} />;
  }

  return (
    <div className="h-screen flex flex-col bg-black relative">
      <ToastContainer />

      {connectionState === 'connecting' && (
        <div className="border-b border-white/10 bg-white/5 text-white/50 px-4 py-2 text-center text-xs tracking-wider uppercase">
          Connecting...
        </div>
      )}
      {connectionState === 'reconnecting' && (
        <div className="border-b border-white/10 bg-white/5 text-white/40 px-4 py-2 text-center text-xs tracking-wider uppercase animate-pulse">
          Reconnecting...
        </div>
      )}
      {error && (
        <div className="border-b border-red-500/20 bg-red-500/5 text-red-400/80 px-4 py-2 text-center text-sm font-light">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative pb-20">
          <VideoGrid
            localStream={localStream}
            peers={peers}
            displayName={displayName}
            isVideoEnabled={isVideoEnabled}
          />

          <ControlsBar
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            onToggleAudio={() => useRoomStore.getState().toggleAudio()}
            onToggleVideo={() => useRoomStore.getState().toggleVideo()}
            onScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
            onLeave={handleLeave}
            roomId={roomId}
          />
        </div>

        {isParticipantsOpen && (
          <ParticipantSidebar
            peers={peers}
            localDisplayName={displayName}
            isLocalAudioEnabled={isAudioEnabled}
            isLocalVideoEnabled={isVideoEnabled}
          />
        )}
        {isChatOpen && (
          <ChatPanel onSendMessage={sendChatMessage} />
        )}
      </div>
    </div>
  );
}

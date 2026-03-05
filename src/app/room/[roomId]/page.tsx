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
import { HelpModal } from '@/components/HelpModal';
import { ReactionOverlay } from '@/components/ReactionOverlay';
import { playJoinSound, playLeaveSound } from '@/lib/sounds';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const urlPassword = searchParams.get('p') || undefined;
  const [hasJoined, setHasJoined] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | undefined>(urlPassword);
  const { joinRoom, leaveRoom, sendChatMessage, sendHandRaise, sendReaction, sendHostMute, startScreenShare, stopScreenShare } = useRoom(roomId);
  const {
    displayName,
    localStream,
    peers,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    isParticipantsOpen,
    isHelpOpen,
    isHost,
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

  // Toast + sound on peer join/leave
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
          playJoinSound();
        }
      }
    }
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        addToast('A participant left');
        playLeaveSound();
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'm':
          useRoomStore.getState().toggleAudio();
          break;
        case 'v':
          useRoomStore.getState().toggleVideo();
          break;
        case 'h':
          sendHandRaise(!useRoomStore.getState().handRaised);
          break;
        case '?':
          useRoomStore.getState().toggleHelp();
          break;
        case 'escape':
          if (useRoomStore.getState().isHelpOpen) {
            useRoomStore.getState().toggleHelp();
          } else {
            handleLeave();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasJoined, handleLeave, sendHandRaise]);

  if (!hasJoined) {
    return <PreJoinScreen roomId={roomId} onJoin={handlePreJoin} initialPassword={urlPassword} />;
  }

  // Fatal error — go back to pre-join with the error shown inline
  if (error && connectionState === 'disconnected') {
    return (
      <PreJoinScreen
        roomId={roomId}
        onJoin={(name, pw) => {
          joinedRef.current = false;
          useRoomStore.getState().setError(null);
          handlePreJoin(name, pw);
        }}
        initialPassword={urlPassword}
        initialError={error}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black relative">
      <ToastContainer />
      <ReactionOverlay />
      {isHelpOpen && <HelpModal />}

      {connectionState === 'connecting' && (
        <div className="border-b border-white/10 bg-white/5 px-4 py-2 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
          <span className="text-white/50 text-xs tracking-wider uppercase">Connecting...</span>
        </div>
      )}
      {connectionState === 'reconnecting' && (
        <div className="border-b border-white/10 bg-white/5 px-4 py-2 flex items-center justify-center gap-2 animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          <span className="text-white/40 text-xs tracking-wider uppercase">Reconnecting...</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative pb-16 sm:pb-20">
          <VideoGrid
            localStream={localStream}
            peers={peers}
            displayName={displayName}
            isVideoEnabled={isVideoEnabled}
            isHost={isHost}
            onMutePeer={sendHostMute}
          />

          <ControlsBar
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            onToggleAudio={() => useRoomStore.getState().toggleAudio()}
            onToggleVideo={() => useRoomStore.getState().toggleVideo()}
            onScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
            onLeave={handleLeave}
            onHandRaise={sendHandRaise}
            onReaction={sendReaction}
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

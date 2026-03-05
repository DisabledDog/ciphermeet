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

  // Fatal error screen (wrong password, room full, etc.)
  if (error && connectionState === 'disconnected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-red-500/20 bg-red-500/5 mb-2">
            <svg className="w-7 h-7 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-white/90 tracking-wide">
            {error.includes('password') ? 'Wrong Password' : error.includes('full') ? 'Room Full' : 'Connection Failed'}
          </h1>
          <p className="text-white/30 text-sm font-light">{error}</p>
          <div className="pt-2 space-y-3">
            <button
              onClick={() => { handleLeave(); }}
              className="w-full py-3.5 bg-white text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 border border-white/15 text-white/50 font-light rounded-xl transition-all hover:bg-white/5 hover:text-white/70 text-sm"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useRoomStore } from '@/store/useRoomStore';
import { VideoGrid } from '@/components/VideoGrid';
import { ControlsBar } from '@/components/ControlsBar';
import { ParticipantSidebar } from '@/components/ParticipantSidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { PreJoinScreen } from '@/components/PreJoinScreen';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [hasJoined, setHasJoined] = useState(false);
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

  const handlePreJoin = (name: string) => {
    useRoomStore.getState().setDisplayName(name);
    setHasJoined(true);
  };

  useEffect(() => {
    if (hasJoined && displayName && !joinedRef.current) {
      joinedRef.current = true;
      joinRoom();
    }
  }, [hasJoined, displayName, joinRoom]);

  const handleLeave = () => {
    leaveRoom();
    joinedRef.current = false;
    setHasJoined(false);
  };

  if (!hasJoined) {
    return <PreJoinScreen roomId={roomId} onJoin={handlePreJoin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {connectionState === 'connecting' && (
        <div className="bg-blue-900/50 border border-blue-700 text-blue-200 px-4 py-2 text-center text-sm">
          Connecting...
        </div>
      )}
      {connectionState === 'reconnecting' && (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-2 text-center text-sm animate-pulse">
          Reconnecting...
        </div>
      )}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 text-center text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col">
          <VideoGrid
            localStream={localStream}
            peers={peers}
            displayName={displayName}
            isVideoEnabled={isVideoEnabled}
          />
        </div>

        {/* Sidebars */}
        {isParticipantsOpen && (
          <ParticipantSidebar
            peers={peers}
            localDisplayName={displayName}
            isLocalAudioEnabled={isAudioEnabled}
            isLocalVideoEnabled={isVideoEnabled}
          />
        )}
        {isChatOpen && (
          <ChatPanel
            onSendMessage={sendChatMessage}
          />
        )}
      </div>

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
  );
}

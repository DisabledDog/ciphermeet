'use client';

import { useEffect, useState } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { useToastStore } from '@/store/useToastStore';
import { ReactionPicker } from './ReactionPicker';

interface ControlsBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onScreenShare: () => void;
  onLeave: () => void;
  onHandRaise: (raised: boolean) => void;
  onReaction: (emoji: string) => void;
  roomId: string;
  onGoLive?: () => void;
  isStreaming?: boolean;
}

export function ControlsBar({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onScreenShare,
  onLeave,
  onHandRaise,
  onReaction,
  roomId,
  onGoLive,
  isStreaming,
}: ControlsBarProps) {
  const toggleChat = useRoomStore((s) => s.toggleChat);
  const toggleParticipants = useRoomStore((s) => s.toggleParticipants);
  const toggleHelp = useRoomStore((s) => s.toggleHelp);
  const handRaised = useRoomStore((s) => s.handRaised);
  const addToast = useToastStore((s) => s.addToast);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    addToast('Invite link copied');
  };

  const btnBase = "p-2.5 sm:p-3 rounded-xl border transition-all";
  const btnDefault = `${btnBase} border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white`;
  const btnActive = `${btnBase} border-white/30 bg-white/15 text-white`;
  const btnDanger = `${btnBase} border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300`;
  const btnOff = `${btnBase} border-red-500/30 bg-red-500/10 text-red-400`;

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-1rem)]">
      {/* Not recorded indicator */}
      <div className="flex justify-center mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 border border-white/5 rounded-full backdrop-blur-sm">
          <svg className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="text-white/20 text-[9px] tracking-[0.15em] uppercase">Not recorded</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 bg-black/80 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl">
        {/* Room timer — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 mr-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white/40 text-xs font-mono tracking-wider">{formatTime(elapsed)}</span>
        </div>

        <div className="hidden sm:block w-px h-6 bg-white/10" />

        {/* E2E badge — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1 px-2 mr-1" title="End-to-end encrypted">
          <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-white/30 text-[10px] tracking-wider uppercase">E2E</span>
        </div>

        <div className="hidden sm:block w-px h-6 bg-white/10" />

        {/* Mic toggle */}
        <button onClick={onToggleAudio} className={isAudioEnabled ? btnDefault : btnOff} title={isAudioEnabled ? 'Mute (M)' : 'Unmute (M)'}>
          {isAudioEnabled ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>

        {/* Camera toggle */}
        <button onClick={onToggleVideo} className={isVideoEnabled ? btnDefault : btnOff} title={isVideoEnabled ? 'Camera off (V)' : 'Camera on (V)'}>
          {isVideoEnabled ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>

        {/* Screen share — hidden on mobile */}
        <button onClick={onScreenShare} className={`hidden sm:block ${isScreenSharing ? btnActive : btnDefault}`} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Go Live — hidden on mobile, host only */}
        {onGoLive && (
          <button onClick={onGoLive} className={`hidden sm:flex items-center gap-1.5 ${isStreaming ? `${btnBase} border-red-500/40 bg-red-500/15 text-red-400` : btnDefault}`} title={isStreaming ? 'Streaming live' : 'Go live'}>
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-white/30'}`} />
            <span className="text-xs font-medium">{isStreaming ? 'LIVE' : 'Go Live'}</span>
          </button>
        )}

        <div className="w-px h-6 bg-white/10" />

        {/* Hand raise */}
        <button
          onClick={() => onHandRaise(!handRaised)}
          className={handRaised ? btnActive : btnDefault}
          title={handRaised ? 'Lower hand (H)' : 'Raise hand (H)'}
        >
          <span className="text-lg leading-none">✋</span>
        </button>

        {/* Reactions */}
        <ReactionPicker onReaction={onReaction} />

        <div className="w-px h-6 bg-white/10" />

        {/* Copy invite link */}
        <button onClick={copyInviteLink} className={btnDefault} title="Copy invite link">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Participants */}
        <button onClick={toggleParticipants} className={btnDefault} title="Participants">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>

        {/* Chat */}
        <button onClick={toggleChat} className={btnDefault} title="Chat">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Help — hidden on mobile */}
        <button onClick={toggleHelp} className={`hidden sm:block ${btnDefault}`} title="Help & shortcuts (?)">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <div className="hidden sm:block w-px h-6 bg-white/10" />

        {/* Leave */}
        <button onClick={onLeave} className={btnDanger} title="Leave call">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

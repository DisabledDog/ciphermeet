'use client';

import { useEffect, useRef } from 'react';
import { useAudioLevel } from '@/hooks/useAudioLevel';

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  handRaised?: boolean;
  canMute?: boolean;
  onMute?: () => void;
}

export function VideoTile({ stream, displayName, isLocal, isMuted, isVideoOff, handRaised, canMute, onMute }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioLevel = useAudioLevel(stream, !isMuted);
  const isSpeaking = audioLevel > 0.15;

  // Video element — always muted (for autoplay), audio handled separately
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch(() => {});

    const handleTrack = () => {
      video.play().catch(() => {});
    };
    stream.addEventListener('addtrack', handleTrack);
    return () => stream.removeEventListener('addtrack', handleTrack);
  }, [stream]);

  // Separate audio playback for remote peers (not muted by autoplay policy)
  useEffect(() => {
    if (isLocal || !stream) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.srcObject = stream;
    audio.play().catch(() => {});

    const handleTrack = () => {
      audio.play().catch(() => {});
    };
    stream.addEventListener('addtrack', handleTrack);
    return () => stream.removeEventListener('addtrack', handleTrack);
  }, [stream, isLocal]);

  return (
    <div
      className={`group relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center transition-all duration-300 ${
        isSpeaking
          ? 'border-2 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
          : 'border border-white/10'
      }`}
    >
      {/* Hidden audio element for remote peers */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-black">
          <div className={`w-20 h-20 rounded-full border bg-white/5 flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
            isSpeaking
              ? 'border-white/50 text-white/80 shadow-[0_0_25px_rgba(255,255,255,0.15)]'
              : 'border-white/20 text-white/60'
          }`}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Hand raise indicator */}
      {handRaised && (
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-lg">
          <span className="text-base">✋</span>
        </div>
      )}

      {/* Speaking indicator dot */}
      {isSpeaking && (
        <div className="absolute top-2 right-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
        </div>
      )}

      {/* Host mute button */}
      {canMute && !isLocal && onMute && (
        <button
          onClick={onMute}
          className="absolute top-2 right-10 bg-black/70 backdrop-blur-sm border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          title="Mute participant"
        >
          <svg className="w-3.5 h-3.5 text-white/50 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </button>
      )}

      {/* Name label */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/80 border border-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm text-white/70">
        {isMuted && (
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
          </svg>
        )}
        <span className="font-light tracking-wide">{isLocal ? `${displayName} (You)` : displayName}</span>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { useAudioLevel } from '@/hooks/useAudioLevel';

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export function VideoTile({ stream, displayName, isLocal, isMuted, isVideoOff }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioLevel = useAudioLevel(stream, !isMuted);
  const isSpeaking = audioLevel > 0.15;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center transition-all duration-300 ${
        isSpeaking
          ? 'border-2 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
          : 'border border-white/10'
      }`}
    >
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
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

      {/* Speaking indicator dot */}
      {isSpeaking && (
        <div className="absolute top-2 right-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
        </div>
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

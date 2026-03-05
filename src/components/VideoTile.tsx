'use client';

import { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export function VideoTile({ stream, displayName, isLocal, isMuted, isVideoOff }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-black border border-white/10 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
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
          <div className="w-20 h-20 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-2xl font-bold text-white/60">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/80 border border-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm text-white/70">
        {isMuted && (
          <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.5 4.5l21 15m-21 0l21-15M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        )}
        <span className="font-light tracking-wide">{isLocal ? `${displayName} (You)` : displayName}</span>
      </div>
    </div>
  );
}

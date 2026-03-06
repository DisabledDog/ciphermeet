'use client';

import { useState } from 'react';

interface StreamSettingsModalProps {
  onClose: () => void;
  onStartStream: (rtmpUrl: string) => void;
  isStreaming: boolean;
  onStopStream: () => void;
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook Live', urlPrefix: 'rtmps://live-api-s.facebook.com:443/rtmp/', placeholder: 'Stream key from Facebook' },
  { id: 'twitch', name: 'Twitch', urlPrefix: 'rtmp://live.twitch.tv/app/', placeholder: 'Stream key from Twitch' },
  { id: 'youtube', name: 'YouTube Live', urlPrefix: 'rtmp://a.rtmp.youtube.com/live2/', placeholder: 'Stream key from YouTube Studio' },
  { id: 'tiktok', name: 'TikTok Live', urlPrefix: 'rtmp://push.tiktokv.com/game/stream/', placeholder: 'Stream key from TikTok' },
  { id: 'custom', name: 'Custom RTMP', urlPrefix: '', placeholder: 'Full RTMP URL (rtmp://...)' },
];

export function StreamSettingsModal({ onClose, onStartStream, isStreaming, onStopStream }: StreamSettingsModalProps) {
  const [platform, setPlatform] = useState('facebook');
  const [streamKey, setStreamKey] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform)!;
  const isCustom = platform === 'custom';

  const handleStart = () => {
    const url = isCustom ? customUrl.trim() : `${selectedPlatform.urlPrefix}${streamKey.trim()}`;
    if (!url) return;
    onStartStream(url);
  };

  const canStart = isCustom ? customUrl.trim().startsWith('rtmp') : streamKey.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-2xl" />

        <div className="relative bg-black rounded-2xl p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a4 4 0 010-5.656m5.656 0a4 4 0 010 5.656M12 12h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-light text-white/90">Go Live</h2>
                <p className="text-white/25 text-[10px] tracking-wider uppercase">Stream to a platform</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isStreaming ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-light">Streaming live</span>
              </div>
              <button
                onClick={onStopStream}
                className="w-full py-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-all"
              >
                Stop Streaming
              </button>
            </div>
          ) : (
            <>
              {/* Platform selector */}
              <div className="space-y-2">
                <label className="block text-[10px] text-white/30 uppercase tracking-wider">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-light transition-all ${
                        platform === p.id
                          ? 'border-white/30 bg-white/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Stream key / URL input */}
              <div className="space-y-2">
                <label className="block text-[10px] text-white/30 uppercase tracking-wider">
                  {isCustom ? 'RTMP URL' : 'Stream Key'}
                </label>
                {isCustom ? (
                  <input
                    type="text"
                    placeholder="rtmp://..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all font-mono text-sm"
                  />
                ) : (
                  <input
                    type="password"
                    placeholder={selectedPlatform.placeholder}
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all font-mono text-sm"
                  />
                )}
                <p className="text-white/15 text-[10px] tracking-wider">
                  Your stream key is never stored and only used for this session
                </p>
              </div>

              <button
                onClick={handleStart}
                disabled={!canStart}
                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                Go Live
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

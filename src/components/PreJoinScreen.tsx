'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';

interface PreJoinScreenProps {
  roomId: string;
  onJoin: (displayName: string, password?: string) => void;
  initialPassword?: string;
}

export function PreJoinScreen({ roomId, onJoin, initialPassword }: PreJoinScreenProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState(initialPassword || '');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [devices, setDevices] = useState<{ audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] }>({ audio: [], video: [] });
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<{ exists: boolean; hasPassword: boolean; peerCount: number } | null>(null);
  const [checking, setChecking] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check room info
  useEffect(() => {
    const checkRoom = async () => {
      try {
        const socket = getSocket();
        socket.connect();

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => { resolve(); }, 5000);
          socket.once('connect', () => { clearTimeout(timeout); resolve(); });
          if (socket.connected) { clearTimeout(timeout); resolve(); }
        });

        if (socket.connected) {
          socket.emit('room-info', { roomId }, (info: any) => {
            setRoomInfo(info);
            setChecking(false);
            socket.removeAllListeners();
            disconnectSocket();
          });
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    };
    checkRoom();
  }, [roomId]);

  const startPreview = async (audioDeviceId?: string, videoDeviceId?: string) => {
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: videoDeviceId
          ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPreviewStream(stream);
      setPermissionError(null);

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audio: allDevices.filter((d) => d.kind === 'audioinput'),
        video: allDevices.filter((d) => d.kind === 'videoinput'),
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setPermissionError('Camera/microphone access was denied. Please allow access in your browser settings.');
      } else {
        setPermissionError('Could not access camera or microphone.');
      }
    }
  };

  useEffect(() => {
    startPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const togglePreviewAudio = () => {
    if (previewStream) {
      previewStream.getAudioTracks().forEach((t) => { t.enabled = !audioEnabled; });
    }
    setAudioEnabled(!audioEnabled);
  };

  const togglePreviewVideo = () => {
    if (previewStream) {
      previewStream.getVideoTracks().forEach((t) => { t.enabled = !videoEnabled; });
    }
    setVideoEnabled(!videoEnabled);
  };

  const handleAudioDeviceChange = (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    startPreview(deviceId, selectedVideoDevice || undefined);
  };

  const handleVideoDeviceChange = (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    startPreview(selectedAudioDevice || undefined, deviceId);
  };

  const handleJoin = () => {
    if (!name.trim()) return;
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
    }
    onJoin(name.trim(), roomInfo?.hasPassword ? password : undefined);
  };

  const needsPassword = roomInfo?.hasPassword && !initialPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Ready to join?</h1>
          <p className="text-gray-500 text-sm font-mono">{roomId}</p>
          {roomInfo && roomInfo.exists && roomInfo.peerCount > 0 && (
            <p className="text-gray-400 text-xs mt-1">{roomInfo.peerCount} participant{roomInfo.peerCount !== 1 ? 's' : ''} in room</p>
          )}
        </div>

        {/* Video preview */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video max-w-lg mx-auto">
          {previewStream && videoEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              {permissionError ? (
                <p className="text-red-400 text-sm px-8 text-center">{permissionError}</p>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold text-white">
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
          )}

          {/* Preview controls overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={togglePreviewAudio}
              className={`p-2.5 rounded-full transition-colors ${
                audioEnabled ? 'bg-gray-700/80 hover:bg-gray-600 text-white' : 'bg-red-600 text-white'
              }`}
              title={audioEnabled ? 'Mute' : 'Unmute'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {audioEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </>
                )}
              </svg>
            </button>
            <button
              onClick={togglePreviewVideo}
              className={`p-2.5 rounded-full transition-colors ${
                videoEnabled ? 'bg-gray-700/80 hover:bg-gray-600 text-white' : 'bg-red-600 text-white'
              }`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {videoEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Device selection */}
        {devices.audio.length > 1 || devices.video.length > 1 ? (
          <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
            {devices.audio.length > 1 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Microphone</label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => handleAudioDeviceChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {devices.audio.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || 'Microphone'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {devices.video.length > 1 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Camera</label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => handleVideoDeviceChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {devices.video.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || 'Camera'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : null}

        {/* Name + Password + Join */}
        <div className="max-w-lg mx-auto space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) handleJoin();
            }}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-center"
            autoFocus
          />

          {needsPassword && (
            <input
              type="password"
              placeholder="Room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) handleJoin();
              }}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-center"
            />
          )}

          <button
            onClick={handleJoin}
            disabled={!name.trim() || (needsPassword && !password.trim()) || checking}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all"
          >
            {checking ? 'Checking room...' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

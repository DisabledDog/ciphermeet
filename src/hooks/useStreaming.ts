'use client';

import { useCallback, useRef, useState } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { getSocket } from '@/lib/socket';

export function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceNodesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());

  const startStream = useCallback((rtmpUrl: string) => {
    const state = useRoomStore.getState();
    const socket = getSocket();

    // Tell server to start FFmpeg with RTMP URL
    socket.emit('stream-start', { rtmpUrl }, (response: { error?: string }) => {
      if (response.error) {
        console.error('Stream start error:', response.error);
        return;
      }

      // Create offscreen canvas for compositing
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d')!;

      // Create audio mixer
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      audioDestRef.current = dest;

      // Mix local audio
      if (state.localStream) {
        const audioTracks = state.localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          const source = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));
          source.connect(dest);
          sourceNodesRef.current.set('local', source);
        }
      }

      // Mix peer audio
      for (const [peerId, peer] of state.peers) {
        if (peer.stream) {
          const audioTracks = peer.stream.getAudioTracks();
          if (audioTracks.length > 0) {
            const source = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));
            source.connect(dest);
            sourceNodesRef.current.set(peerId, source);
          }
        }
      }

      // Render loop — composite all video tiles onto canvas
      const renderFrame = () => {
        const currentState = useRoomStore.getState();
        const allStreams: { stream: MediaStream | null; name: string }[] = [];

        // Local stream
        allStreams.push({ stream: currentState.localStream, name: currentState.displayName });

        // Remote streams
        for (const peer of currentState.peers.values()) {
          allStreams.push({ stream: peer.stream, name: peer.displayName });
        }

        const count = allStreams.length;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1280, 720);

        // Calculate grid layout
        let cols = 1, rows = 1;
        if (count <= 1) { cols = 1; rows = 1; }
        else if (count <= 2) { cols = 2; rows = 1; }
        else if (count <= 4) { cols = 2; rows = 2; }
        else if (count <= 6) { cols = 3; rows = 2; }
        else if (count <= 9) { cols = 3; rows = 3; }
        else { cols = 4; rows = Math.ceil(count / 4); }

        const tileW = Math.floor(1280 / cols);
        const tileH = Math.floor(720 / rows);

        allStreams.forEach((item, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * tileW;
          const y = row * tileH;

          if (item.stream) {
            const videoTrack = item.stream.getVideoTracks()[0];
            if (videoTrack && videoTrack.readyState === 'live') {
              // Get video element from DOM or create temp one
              const videos = document.querySelectorAll('video');
              for (const video of videos) {
                if (video.srcObject === item.stream && video.readyState >= 2) {
                  ctx.drawImage(video, x, y, tileW, tileH);
                  break;
                }
              }
            }
          }

          // Draw name label
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(x + 8, y + tileH - 30, ctx.measureText(item.name).width + 16, 24);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '14px system-ui, sans-serif';
          ctx.fillText(item.name, x + 16, y + tileH - 12);
        });

        animFrameRef.current = requestAnimationFrame(renderFrame);
      };

      animFrameRef.current = requestAnimationFrame(renderFrame);

      // Create combined stream: canvas video + mixed audio
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      // Record and send chunks to server
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')
          ? 'video/webm;codecs=h264,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm',
        videoBitsPerSecond: 3000000,
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => {
            socket.emit('stream-data', buf);
          });
        }
      };

      recorder.start(1000); // Send chunk every 1 second
      recorderRef.current = recorder;
      setIsStreaming(true);
    });
  }, []);

  const stopStream = useCallback(() => {
    const socket = getSocket();

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    cancelAnimationFrame(animFrameRef.current);

    // Disconnect audio nodes
    for (const source of sourceNodesRef.current.values()) {
      source.disconnect();
    }
    sourceNodesRef.current.clear();

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    canvasRef.current = null;
    socket.emit('stream-stop');
    setIsStreaming(false);
  }, []);

  return { isStreaming, startStream, stopStream };
}

import { Server as SocketServer, Socket } from 'socket.io';
import { DtlsParameters, MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup/node/lib/types';
import { createRoom, getRoom, deleteRoom, cleanupRooms, getRoomCount } from './lib/roomManager';
import { Peer } from './lib/Peer';
import { ChildProcess, spawn } from 'child_process';

export function setupSignaling(io: SocketServer): void {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentPeerId: string | null = null;
    let ffmpegProcess: ChildProcess | null = null;

    console.log(`[Signaling] Socket connected`);

    // Host creates a room and gets back the room code
    socket.on('create-room', async (
      data: { password?: string },
      callback: (response: { roomId?: string; error?: string }) => void
    ) => {
      try {
        const ip = socket.handshake.address;
        const room = await createRoom(undefined, data.password, ip);
        callback({ roomId: room.id });
      } catch (err: any) {
        console.error('[Signaling] create-room error:', err);
        callback({ error: err.message });
      }
    });

    // Check if a room exists and whether it needs a password
    socket.on('room-info', (
      data: { roomId: string },
      callback: (response: { exists: boolean; hasPassword: boolean; peerCount: number }) => void
    ) => {
      const room = getRoom(data.roomId);
      if (!room) {
        callback({ exists: false, hasPassword: false, peerCount: 0 });
        return;
      }
      callback({
        exists: true,
        hasPassword: !!room.password,
        peerCount: room.peerCount,
      });
    });

    socket.on('join-room', async (
      data: { roomId: string; peerId: string; displayName: string; password?: string },
      callback: (response: { rtpCapabilities?: RtpCapabilities; error?: string }) => void
    ) => {
      try {
        const { roomId, peerId, displayName } = data;

        let room = getRoom(roomId);
        if (!room) {
          // Auto-create room if it doesn't exist (for direct link joins)
          room = await createRoom(roomId);
        }

        if (!room.checkPassword(data.password)) {
          callback({ error: 'Incorrect password' });
          return;
        }

        if (room.isFull()) {
          callback({ error: 'Room is full (max 30 participants)' });
          return;
        }

        const peer = new Peer(peerId, displayName);
        room.addPeer(peer);

        currentRoomId = roomId;
        currentPeerId = peerId;

        socket.join(roomId);

        // Notify existing peers about the new peer
        socket.to(roomId).emit('new-peer', {
          peerId,
          displayName,
        });

        // Send existing producers to the new peer
        const existingProducers: { peerId: string; producerId: string; kind: MediaKind }[] = [];
        for (const otherPeer of room.getOtherPeers(peerId)) {
          for (const producer of otherPeer.producers.values()) {
            existingProducers.push({
              peerId: otherPeer.id,
              producerId: producer.id,
              kind: producer.kind,
            });
          }
        }

        callback({ rtpCapabilities: room.router.rtpCapabilities });

        // Tell the peer if they're the host
        socket.emit('host-info', { hostPeerId: room.hostPeerId });

        // Send existing producers after callback
        if (existingProducers.length > 0) {
          socket.emit('existing-producers', existingProducers);
        }

        // Send current peers list
        const peersList = Array.from(room.peers.values()).map((p) => ({
          peerId: p.id,
          displayName: p.displayName,
        }));
        socket.emit('peers-list', peersList);

      } catch (err: any) {
        console.error('[Signaling] join-room error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('create-transport', async (
      data: { direction: 'send' | 'recv' },
      callback: (response: any) => void
    ) => {
      try {
        const room = getRoom(currentRoomId!);
        const peer = room?.getPeer(currentPeerId!);
        if (!room || !peer) {
          callback({ error: 'Not in a room' });
          return;
        }

        const transport = await room.createWebRtcTransport();
        console.log(`[Signaling] Created ${data.direction} transport for peer ${currentPeerId}`);

        if (data.direction === 'send') {
          peer.sendTransport = transport;
        } else {
          peer.recvTransport = transport;
        }

        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (err: any) {
        console.error('[Signaling] create-transport error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('connect-transport', async (
      data: { direction: 'send' | 'recv'; dtlsParameters: DtlsParameters },
      callback: (response: { error?: string }) => void
    ) => {
      try {
        const room = getRoom(currentRoomId!);
        const peer = room?.getPeer(currentPeerId!);
        if (!room || !peer) {
          callback({ error: 'Not in a room' });
          return;
        }

        const transport = data.direction === 'send' ? peer.sendTransport : peer.recvTransport;
        if (!transport) {
          callback({ error: 'Transport not found' });
          return;
        }

        await transport.connect({ dtlsParameters: data.dtlsParameters });
        callback({});
      } catch (err: any) {
        console.error('[Signaling] connect-transport error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('produce', async (
      data: { kind: MediaKind; rtpParameters: RtpParameters; appData?: Record<string, unknown> },
      callback: (response: { id?: string; error?: string }) => void
    ) => {
      try {
        const room = getRoom(currentRoomId!);
        const peer = room?.getPeer(currentPeerId!);
        if (!room || !peer || !peer.sendTransport) {
          callback({ error: 'Not in a room or no send transport' });
          return;
        }

        const producer = await peer.sendTransport.produce({
          kind: data.kind,
          rtpParameters: data.rtpParameters,
          appData: data.appData || {},
        });

        peer.addProducer(producer);

        producer.on('transportclose', () => {
          peer.removeProducer(producer.id);
        });

        // Notify other peers about the new producer
        socket.to(currentRoomId!).emit('new-producer', {
          peerId: currentPeerId,
          producerId: producer.id,
          kind: producer.kind,
        });

        callback({ id: producer.id });
      } catch (err: any) {
        console.error('[Signaling] produce error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('consume', async (
      data: { producerId: string; rtpCapabilities: RtpCapabilities },
      callback: (response: any) => void
    ) => {
      try {
        const room = getRoom(currentRoomId!);
        const peer = room?.getPeer(currentPeerId!);
        if (!room || !peer || !peer.recvTransport) {
          callback({ error: 'Not in a room or no recv transport' });
          return;
        }

        if (!room.router.canConsume({
          producerId: data.producerId,
          rtpCapabilities: data.rtpCapabilities,
        })) {
          callback({ error: 'Cannot consume this producer' });
          return;
        }

        const consumer = await peer.recvTransport.consume({
          producerId: data.producerId,
          rtpCapabilities: data.rtpCapabilities,
          paused: true,
        });

        peer.addConsumer(consumer);

        consumer.on('transportclose', () => {
          peer.removeConsumer(consumer.id);
        });

        consumer.on('producerclose', () => {
          peer.removeConsumer(consumer.id);
          socket.emit('consumer-closed', { consumerId: consumer.id });
        });

        callback({
          id: consumer.id,
          producerId: data.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (err: any) {
        console.error('[Signaling] consume error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('resume-consumer', async (
      data: { consumerId: string },
      callback: (response: { error?: string }) => void
    ) => {
      try {
        const room = getRoom(currentRoomId!);
        const peer = room?.getPeer(currentPeerId!);
        if (!room || !peer) {
          callback({ error: 'Not in a room' });
          return;
        }

        const consumer = peer.consumers.get(data.consumerId);
        if (!consumer) {
          callback({ error: 'Consumer not found' });
          return;
        }

        await consumer.resume();
        callback({});
      } catch (err: any) {
        console.error('[Signaling] resume-consumer error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('close-producer', async (
      data: { producerId: string },
      callback: (response: { error?: string }) => void
    ) => {
      try {
        const room = getRoom(currentRoomId!);
        const peer = room?.getPeer(currentPeerId!);
        if (!room || !peer) {
          callback({ error: 'Not in a room' });
          return;
        }

        const producer = peer.producers.get(data.producerId);
        if (producer) {
          producer.close();
          peer.removeProducer(data.producerId);

          socket.to(currentRoomId!).emit('producer-closed', {
            peerId: currentPeerId,
            producerId: data.producerId,
          });
        }

        callback({});
      } catch (err: any) {
        console.error('[Signaling] close-producer error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('host-mute', (data: { targetPeerId: string }) => {
      if (!currentRoomId || !currentPeerId) return;
      const room = getRoom(currentRoomId);
      if (!room) return;

      // Only host can mute others
      if (room.hostPeerId !== currentPeerId) return;

      const targetPeer = room.getPeer(data.targetPeerId);
      if (!targetPeer) return;

      // Tell the target peer to mute themselves
      io.to(currentRoomId).emit('host-mute', {
        peerId: data.targetPeerId,
        by: currentPeerId,
      });
    });

    socket.on('hand-raise', (data: { raised: boolean }) => {
      if (!currentRoomId || !currentPeerId) return;
      const room = getRoom(currentRoomId);
      const peer = room?.getPeer(currentPeerId);
      if (!room || !peer) return;

      io.to(currentRoomId).emit('hand-raise', {
        peerId: currentPeerId,
        displayName: peer.displayName,
        raised: data.raised,
      });
    });

    socket.on('reaction', (data: { emoji: string }) => {
      if (!currentRoomId || !currentPeerId) return;
      const room = getRoom(currentRoomId);
      const peer = room?.getPeer(currentPeerId);
      if (!room || !peer) return;

      const allowed = ['👍', '👎', '❤️', '😂', '👏', '🎉'];
      if (!allowed.includes(data.emoji)) return;

      io.to(currentRoomId).emit('reaction', {
        peerId: currentPeerId,
        displayName: peer.displayName,
        emoji: data.emoji,
        timestamp: Date.now(),
      });
    });

    socket.on('chat-message', (data: { message: string }) => {
      if (!currentRoomId || !currentPeerId) return;
      if (!data.message || typeof data.message !== 'string') return;

      const room = getRoom(currentRoomId);
      const peer = room?.getPeer(currentPeerId);
      if (!room || !peer) return;

      const message = data.message.trim().slice(0, 2000);
      if (!message) return;

      io.to(currentRoomId).emit('chat-message', {
        peerId: currentPeerId,
        displayName: peer.displayName,
        message,
        timestamp: Date.now(),
      });
    });

    // RTMP Streaming
    socket.on('stream-start', (
      data: { rtmpUrl: string },
      callback: (response: { error?: string }) => void
    ) => {
      if (!currentRoomId || !currentPeerId) {
        callback({ error: 'Not in a room' });
        return;
      }

      // Only host can stream
      const room = getRoom(currentRoomId);
      if (!room || room.hostPeerId !== currentPeerId) {
        callback({ error: 'Only the host can stream' });
        return;
      }

      if (ffmpegProcess) {
        callback({ error: 'Already streaming' });
        return;
      }

      try {
        // Spawn FFmpeg: read WebM from stdin, output RTMP
        ffmpegProcess = spawn('ffmpeg', [
          '-i', 'pipe:0',          // Read from stdin
          '-c:v', 'libx264',       // Re-encode video as H.264
          '-preset', 'veryfast',   // Fast encoding
          '-tune', 'zerolatency',  // Low latency
          '-b:v', '2500k',         // Video bitrate
          '-maxrate', '2500k',
          '-bufsize', '5000k',
          '-pix_fmt', 'yuv420p',
          '-g', '60',              // Keyframe every 2s at 30fps
          '-c:a', 'aac',           // Audio codec
          '-b:a', '128k',          // Audio bitrate
          '-ar', '44100',          // Audio sample rate
          '-f', 'flv',             // Output format
          data.rtmpUrl,            // RTMP destination
        ], {
          stdio: ['pipe', 'ignore', 'pipe'],
        });

        ffmpegProcess.stderr?.on('data', (chunk: Buffer) => {
          // Log FFmpeg output for debugging (first 200 chars)
          const msg = chunk.toString().slice(0, 200);
          if (msg.includes('error') || msg.includes('Error')) {
            console.error('[Stream] FFmpeg error:', msg);
          }
        });

        ffmpegProcess.on('close', (code) => {
          console.log(`[Stream] FFmpeg exited with code ${code}`);
          ffmpegProcess = null;
          socket.emit('stream-ended');
        });

        ffmpegProcess.on('error', (err) => {
          console.error('[Stream] FFmpeg process error:', err.message);
          ffmpegProcess = null;
          socket.emit('stream-ended');
        });

        console.log(`[Stream] Started streaming to RTMP`);
        callback({});
      } catch (err: any) {
        console.error('[Stream] Failed to start:', err);
        callback({ error: 'Failed to start stream. Is FFmpeg installed?' });
      }
    });

    socket.on('stream-data', (data: ArrayBuffer) => {
      if (ffmpegProcess?.stdin && !ffmpegProcess.stdin.destroyed) {
        ffmpegProcess.stdin.write(Buffer.from(data));
      }
    });

    socket.on('stream-stop', () => {
      if (ffmpegProcess) {
        ffmpegProcess.stdin?.end();
        ffmpegProcess.kill('SIGTERM');
        ffmpegProcess = null;
        console.log('[Stream] Stopped streaming');
      }
    });

    socket.on('disconnect', () => {
      // Clean up FFmpeg on disconnect
      if (ffmpegProcess) {
        ffmpegProcess.stdin?.end();
        ffmpegProcess.kill('SIGTERM');
        ffmpegProcess = null;
      }

      console.log(`[Signaling] Socket disconnected`);

      if (currentRoomId && currentPeerId) {
        const room = getRoom(currentRoomId);
        if (room) {
          const peer = room.removePeer(currentPeerId);
          if (peer) {
            socket.to(currentRoomId).emit('peer-left', {
              peerId: currentPeerId,
            });
          }

          if (room.peerCount === 0) {
            deleteRoom(currentRoomId);
          }
        }
      }
    });
  });

  // Periodic cleanup every 30 seconds
  setInterval(() => {
    cleanupRooms();
  }, 30000);
}

import { Server as SocketServer, Socket } from 'socket.io';
import { DtlsParameters, MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup/node/lib/types';
import { createRoom, getRoom, deleteRoom, cleanupRooms, getRoomCount } from './lib/roomManager';
import { Peer } from './lib/Peer';

export function setupSignaling(io: SocketServer): void {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentPeerId: string | null = null;

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

    socket.on('disconnect', () => {
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

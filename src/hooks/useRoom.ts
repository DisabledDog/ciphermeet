'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Device } from 'mediasoup-client';
import type { Transport, Consumer } from 'mediasoup-client/types';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { loadDevice, createSendTransport, createRecvTransport } from '@/lib/mediasoupClient';
import { useRoomStore } from '@/store/useRoomStore';
import { RemotePeer, ProducerInfo, ChatMessage } from '@/types';

export function useRoom(roomId: string) {
  const store = useRoomStore();
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const screenProducerIdRef = useRef<string | null>(null);
  const joinedRef = useRef(false);

  const consumeProducer = useCallback(async (producerInfo: ProducerInfo) => {
    const socket = getSocket();
    const device = deviceRef.current;
    const recvTransport = recvTransportRef.current;

    if (!device || !recvTransport) return;

    return new Promise<void>((resolve) => {
      socket.emit(
        'consume',
        {
          producerId: producerInfo.producerId,
          rtpCapabilities: device.rtpCapabilities,
        },
        async (response: any) => {
          if (response.error) {
            console.error('Consume error:', response.error);
            resolve();
            return;
          }

          const consumer = await recvTransport.consume({
            id: response.id,
            producerId: response.producerId,
            kind: response.kind,
            rtpParameters: response.rtpParameters,
          });

          consumersRef.current.set(consumer.id, consumer);

          const peers = useRoomStore.getState().peers;
          const existingPeer = peers.get(producerInfo.peerId);

          // Create a NEW MediaStream so React detects the change
          const oldStream = existingPeer?.stream;
          const newStream = new MediaStream();
          if (oldStream) {
            oldStream.getTracks().forEach((track) => newStream.addTrack(track));
          }
          newStream.addTrack(consumer.track);

          const consumers = new Map(existingPeer?.consumers || new Map());
          consumers.set(consumer.id, {
            consumerId: consumer.id,
            producerId: producerInfo.producerId,
            kind: response.kind,
            track: consumer.track,
          });

          store.addPeer({
            peerId: producerInfo.peerId,
            displayName: existingPeer?.displayName || producerInfo.peerId,
            consumers,
            stream: newStream,
          });

          socket.emit('resume-consumer', { consumerId: consumer.id }, () => {});
          resolve();
        }
      );
    });
  }, [store]);

  const joinRoom = useCallback(async (password?: string) => {
    if (joinedRef.current) return;

    const socket = getSocket();
    const peerId = crypto.randomUUID();
    const displayName = store.displayName || 'Anonymous';

    store.setPeerId(peerId);
    store.setRoomId(roomId);
    store.setConnectionState('connecting');
    store.setError(null);

    // Wait for socket to actually connect before emitting events
    if (!socket.connected) {
      socket.connect();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timed out. Server may be unavailable.'));
        }, 10000);
        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.once('connect_error', (err) => {
          clearTimeout(timeout);
          reject(new Error('Could not connect to server.'));
        });
      });
    }

    // Connection state listeners for reconnection
    socket.on('disconnect', () => {
      store.setConnectionState('reconnecting');
    });
    socket.io.on('reconnect', () => {
      store.setConnectionState('connected');
    });
    socket.io.on('reconnect_failed', () => {
      store.setConnectionState('disconnected');
      store.setError('Connection lost. Please rejoin the room.');
    });

    // Get local media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });
      store.setLocalStream(stream);

      // Queue to hold producers that arrive before recv transport is ready
      const pendingProducers: ProducerInfo[] = [];
      let recvReady = false;

      // Register ALL listeners BEFORE join-room so we never miss events
      socket.on('existing-producers', async (producers: ProducerInfo[]) => {
        if (!recvReady) {
          pendingProducers.push(...producers);
        } else {
          for (const producer of producers) {
            await consumeProducer(producer);
          }
        }
      });

      socket.on('new-producer', async (producerInfo: ProducerInfo) => {
        if (!recvReady) {
          pendingProducers.push(producerInfo);
        } else {
          await consumeProducer(producerInfo);
        }
      });

      socket.on('new-peer', (data: { peerId: string; displayName: string }) => {
        const peers = useRoomStore.getState().peers;
        const existing = peers.get(data.peerId);
        store.addPeer({
          peerId: data.peerId,
          displayName: data.displayName,
          consumers: existing?.consumers || new Map(),
          stream: existing?.stream || null,
        });
      });

      socket.on('peers-list', (peersList: { peerId: string; displayName: string }[]) => {
        for (const p of peersList) {
          if (p.peerId === peerId) continue;
          const peers = useRoomStore.getState().peers;
          if (!peers.has(p.peerId)) {
            store.addPeer({
              peerId: p.peerId,
              displayName: p.displayName,
              consumers: new Map(),
              stream: null,
            });
          }
        }
      });

      socket.on('producer-closed', (data: { peerId: string; producerId: string }) => {
        for (const [consumerId, consumer] of consumersRef.current) {
          if (consumer.producerId === data.producerId) {
            consumer.close();
            consumersRef.current.delete(consumerId);
          }
        }
      });

      socket.on('consumer-closed', (data: { consumerId: string }) => {
        const consumer = consumersRef.current.get(data.consumerId);
        if (consumer) {
          consumer.close();
          consumersRef.current.delete(data.consumerId);
        }
      });

      socket.on('peer-left', (data: { peerId: string }) => {
        store.removePeer(data.peerId);
      });

      socket.on('chat-message', (message: ChatMessage) => {
        store.addChatMessage(message);
      });

      // NOW join the room (listeners are ready to catch events)
      const rtpCapabilities = await new Promise<any>((resolve, reject) => {
        socket.emit(
          'join-room',
          { roomId, peerId, displayName, password },
          (response: any) => {
            if (response.error) reject(new Error(response.error));
            else resolve(response.rtpCapabilities);
          }
        );
      });

      // Load device
      const device = await loadDevice(rtpCapabilities);
      deviceRef.current = device;

      // Create send transport
      const sendTransportParams = await new Promise<any>((resolve, reject) => {
        socket.emit('create-transport', { direction: 'send' }, (response: any) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
        });
      });
      const sendTransport = createSendTransport(device, sendTransportParams, socket);
      sendTransportRef.current = sendTransport;

      // Create recv transport
      const recvTransportParams = await new Promise<any>((resolve, reject) => {
        socket.emit('create-transport', { direction: 'recv' }, (response: any) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
        });
      });
      const recvTransport = createRecvTransport(device, recvTransportParams, socket);
      recvTransportRef.current = recvTransport;

      // Recv transport is ready — consume any queued producers
      recvReady = true;
      for (const producer of pendingProducers) {
        await consumeProducer(producer);
      }
      pendingProducers.length = 0;

      // Produce local tracks
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      if (audioTrack) {
        await sendTransport.produce({ track: audioTrack });
      }
      if (videoTrack) {
        await sendTransport.produce({ track: videoTrack });
      }

      joinedRef.current = true;
      store.setConnectionState('connected');

    } catch (err: any) {
      console.error('Failed to join room:', err);
      store.setError(err.message || 'Failed to join room');
      store.setConnectionState('disconnected');
    }
  }, [roomId, store, consumeProducer]);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();

    for (const consumer of consumersRef.current.values()) {
      consumer.close();
    }
    consumersRef.current.clear();

    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }
    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }

    const localStream = useRoomStore.getState().localStream;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    deviceRef.current = null;
    joinedRef.current = false;

    socket.removeAllListeners();
    socket.io.removeAllListeners();
    disconnectSocket();
    useRoomStore.getState().reset();
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    const socket = getSocket();
    socket.emit('chat-message', { message });
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (sendTransportRef.current && screenTrack) {
        const producer = await sendTransportRef.current.produce({
          track: screenTrack,
          appData: { screen: true },
        });
        screenProducerIdRef.current = producer.id;

        screenTrack.onended = () => {
          const socket = getSocket();
          if (screenProducerIdRef.current) {
            socket.emit('close-producer', { producerId: screenProducerIdRef.current }, () => {});
            screenProducerIdRef.current = null;
          }
          store.setScreenSharing(false);
        };

        store.setScreenSharing(true);
      }
    } catch (err: any) {
      console.error('Screen share error:', err);
    }
  }, [store]);

  const stopScreenShare = useCallback(() => {
    const socket = getSocket();
    if (screenProducerIdRef.current) {
      socket.emit('close-producer', { producerId: screenProducerIdRef.current }, () => {});
      screenProducerIdRef.current = null;
    }
    store.setScreenSharing(false);
  }, [store]);

  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        leaveRoom();
      }
    };
  }, [leaveRoom]);

  return {
    joinRoom,
    leaveRoom,
    sendChatMessage,
    startScreenShare,
    stopScreenShare,
  };
}

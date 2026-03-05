'use client';

import { create } from 'zustand';
import { ChatMessage, RemotePeer } from '@/types';

interface RoomState {
  roomId: string | null;
  peerId: string | null;
  displayName: string;
  localStream: MediaStream | null;
  peers: Map<string, RemotePeer>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  error: string | null;

  setRoomId: (roomId: string | null) => void;
  setPeerId: (peerId: string | null) => void;
  setDisplayName: (name: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addPeer: (peer: RemotePeer) => void;
  removePeer: (peerId: string) => void;
  updatePeerStream: (peerId: string, stream: MediaStream) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  setScreenSharing: (value: boolean) => void;
  setConnectionState: (state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting') => void;
  addChatMessage: (message: ChatMessage) => void;
  toggleChat: () => void;
  toggleParticipants: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  peerId: null,
  displayName: '',
  localStream: null,
  peers: new Map<string, RemotePeer>(),
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  connectionState: 'disconnected' as const,
  chatMessages: [],
  isChatOpen: false,
  isParticipantsOpen: false,
  error: null,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  ...initialState,

  setRoomId: (roomId) => set({ roomId }),
  setPeerId: (peerId) => set({ peerId }),
  setDisplayName: (displayName) => set({ displayName }),
  setLocalStream: (localStream) => set({ localStream }),

  addPeer: (peer) =>
    set((state) => {
      const peers = new Map(state.peers);
      peers.set(peer.peerId, peer);
      return { peers };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const peers = new Map(state.peers);
      const peer = peers.get(peerId);
      if (peer) {
        // Stop all tracks
        for (const consumer of peer.consumers.values()) {
          consumer.track.stop();
        }
      }
      peers.delete(peerId);
      return { peers };
    }),

  updatePeerStream: (peerId, stream) =>
    set((state) => {
      const peers = new Map(state.peers);
      const peer = peers.get(peerId);
      if (peer) {
        peers.set(peerId, { ...peer, stream });
      }
      return { peers };
    }),

  toggleAudio: () => {
    const state = get();
    const newState = !state.isAudioEnabled;
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
    set({ isAudioEnabled: newState });
  },

  toggleVideo: () => {
    const state = get();
    const newState = !state.isVideoEnabled;
    if (state.localStream) {
      state.localStream.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
    set({ isVideoEnabled: newState });
  },

  setScreenSharing: (value) => set({ isScreenSharing: value }),
  setConnectionState: (connectionState) => set({ connectionState }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  toggleParticipants: () => set((state) => ({ isParticipantsOpen: !state.isParticipantsOpen })),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

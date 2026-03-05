'use client';

import { create } from 'zustand';
import { ChatMessage, Reaction, RemotePeer } from '@/types';

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
  isHelpOpen: boolean;
  error: string | null;
  isHost: boolean;
  handRaised: boolean;
  raisedHands: Set<string>;
  reactions: Reaction[];

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
  toggleHelp: () => void;
  setError: (error: string | null) => void;
  setIsHost: (value: boolean) => void;
  toggleHandRaise: () => void;
  setHandRaised: (peerId: string, raised: boolean) => void;
  addReaction: (reaction: Reaction) => void;
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
  isHelpOpen: false,
  error: null,
  isHost: false,
  handRaised: false,
  raisedHands: new Set<string>(),
  reactions: [] as Reaction[],
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
        for (const consumer of peer.consumers.values()) {
          consumer.track.stop();
        }
      }
      peers.delete(peerId);
      const raisedHands = new Set(state.raisedHands);
      raisedHands.delete(peerId);
      return { peers, raisedHands };
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
  toggleHelp: () => set((state) => ({ isHelpOpen: !state.isHelpOpen })),

  setError: (error) => set({ error }),
  setIsHost: (value) => set({ isHost: value }),

  toggleHandRaise: () => set((state) => ({ handRaised: !state.handRaised })),

  setHandRaised: (peerId, raised) =>
    set((state) => {
      const raisedHands = new Set(state.raisedHands);
      if (raised) raisedHands.add(peerId);
      else raisedHands.delete(peerId);
      return { raisedHands };
    }),

  addReaction: (reaction) =>
    set((state) => ({
      reactions: [...state.reactions, reaction],
    })),

  reset: () => set(initialState),
}));

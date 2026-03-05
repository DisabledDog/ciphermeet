import type { MediaKind } from 'mediasoup-client/types';

export interface PeerInfo {
  peerId: string;
  displayName: string;
}

export interface RemotePeer extends PeerInfo {
  consumers: Map<string, ConsumerInfo>;
  stream: MediaStream | null;
}

export interface ConsumerInfo {
  consumerId: string;
  producerId: string;
  kind: MediaKind;
  track: MediaStreamTrack;
}

export interface ChatMessage {
  peerId: string;
  displayName: string;
  message: string;
  timestamp: number;
}

export interface ProducerInfo {
  peerId: string;
  producerId: string;
  kind: MediaKind;
}

export interface Reaction {
  peerId: string;
  displayName: string;
  emoji: string;
  timestamp: number;
}

import {
  Router,
  WebRtcTransport,
  Worker,
} from 'mediasoup/node/lib/types';
import { config } from '../config';
import { Peer } from './Peer';

const MAX_PEERS = 30;

export class Room {
  id: string;
  router: Router;
  peers: Map<string, Peer> = new Map();
  password: string | null = null;
  hostPeerId: string | null = null;
  createdAt: number = Date.now();
  lastActivityAt: number = Date.now();

  private constructor(id: string, router: Router) {
    this.id = id;
    this.router = router;
  }

  static async create(id: string, worker: Worker, password?: string): Promise<Room> {
    const router = await worker.createRouter({
      mediaCodecs: config.mediasoup.routerMediaCodecs,
    });
    const room = new Room(id, router);
    room.password = password || null;
    console.log(`[Room] Created room ${id}`);
    return room;
  }

  get peerCount(): number {
    return this.peers.size;
  }

  isFull(): boolean {
    return this.peers.size >= MAX_PEERS;
  }

  checkPassword(password?: string): boolean {
    if (!this.password) return true;
    return this.password === password;
  }

  addPeer(peer: Peer): void {
    if (this.isFull()) {
      throw new Error('Room is full');
    }
    this.peers.set(peer.id, peer);
    this.lastActivityAt = Date.now();
    if (!this.hostPeerId) {
      this.hostPeerId = peer.id;
    }
    console.log(`[Room] Peer joined room ${this.id}. Total: ${this.peers.size}`);
  }

  removePeer(peerId: string): Peer | undefined {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
      if (this.hostPeerId === peerId) {
        const next = this.peers.values().next();
        this.hostPeerId = next.done ? null : next.value.id;
      }
      console.log(`[Room] Peer left room ${this.id}. Total: ${this.peers.size}`);
    }
    return peer;
  }

  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  getOtherPeers(excludePeerId: string): Peer[] {
    return Array.from(this.peers.values()).filter((p) => p.id !== excludePeerId);
  }

  async createWebRtcTransport(): Promise<WebRtcTransport> {
    const transport = await this.router.createWebRtcTransport(
      config.mediasoup.webRtcTransportOptions
    );

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        transport.close();
      }
    });

    return transport;
  }

  close(): void {
    for (const peer of this.peers.values()) {
      peer.close();
    }
    this.peers.clear();
    this.router.close();
    console.log(`[Room] Room ${this.id} closed`);
  }
}

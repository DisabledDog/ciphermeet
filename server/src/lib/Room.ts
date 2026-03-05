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

  private constructor(id: string, router: Router) {
    this.id = id;
    this.router = router;
  }

  static async create(id: string, worker: Worker): Promise<Room> {
    const router = await worker.createRouter({
      mediaCodecs: config.mediasoup.routerMediaCodecs,
    });
    console.log(`[Room] Created room ${id}`);
    return new Room(id, router);
  }

  get peerCount(): number {
    return this.peers.size;
  }

  isFull(): boolean {
    return this.peers.size >= MAX_PEERS;
  }

  addPeer(peer: Peer): void {
    if (this.isFull()) {
      throw new Error('Room is full');
    }
    this.peers.set(peer.id, peer);
    console.log(`[Room] Peer joined room ${this.id}. Total: ${this.peers.size}`);
  }

  removePeer(peerId: string): Peer | undefined {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
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

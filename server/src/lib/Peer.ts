import {
  WebRtcTransport,
  Producer,
  Consumer,
} from 'mediasoup/node/lib/types';

export class Peer {
  id: string;
  displayName: string;
  sendTransport: WebRtcTransport | null = null;
  recvTransport: WebRtcTransport | null = null;
  producers: Map<string, Producer> = new Map();
  consumers: Map<string, Consumer> = new Map();

  constructor(id: string, displayName: string) {
    this.id = id;
    this.displayName = displayName;
  }

  addProducer(producer: Producer): void {
    this.producers.set(producer.id, producer);
  }

  removeProducer(producerId: string): void {
    this.producers.delete(producerId);
  }

  addConsumer(consumer: Consumer): void {
    this.consumers.set(consumer.id, consumer);
  }

  removeConsumer(consumerId: string): void {
    this.consumers.delete(consumerId);
  }

  close(): void {
    for (const producer of this.producers.values()) {
      producer.close();
    }
    this.producers.clear();

    for (const consumer of this.consumers.values()) {
      consumer.close();
    }
    this.consumers.clear();

    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }
  }
}

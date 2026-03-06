import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { createWorkers } from './lib/workerManager';
import { setupSignaling } from './signaling';
import { getRoomCount, getRooms } from './lib/roomManager';
async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check + stats
  app.get('/api/health', (_req, res) => {
    const rooms = getRooms();
    let totalPeers = 0;
    for (const room of rooms.values()) {
      totalPeers += room.peerCount;
    }
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      rooms: getRoomCount(),
      peers: totalPeers,
      uptime: Math.round(process.uptime()),
    });
  });

  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 5e6, // 5MB for streaming chunks
  });

  // Start mediasoup workers
  await createWorkers();

  // Setup signaling
  setupSignaling(io);

  httpServer.listen(config.port, () => {
    console.log(`[Server] Listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});

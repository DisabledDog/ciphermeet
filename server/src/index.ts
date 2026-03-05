import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { createWorkers } from './lib/workerManager';
import { setupSignaling } from './signaling';
async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
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

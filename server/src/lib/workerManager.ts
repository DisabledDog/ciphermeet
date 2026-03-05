import * as mediasoup from 'mediasoup';
import { Worker } from 'mediasoup/node/lib/types';
import { config } from '../config';

const workers: Worker[] = [];
let nextWorkerIndex = 0;

export async function createWorkers(): Promise<void> {
  const numWorkers = config.mediasoup.numWorkers;
  console.log(`[WorkerManager] Creating ${numWorkers} mediasoup workers...`);

  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker(config.mediasoup.workerSettings);

    worker.on('died', () => {
      console.error(`[WorkerManager] Worker ${worker.pid} died, restarting...`);
      const index = workers.indexOf(worker);
      if (index !== -1) {
        workers.splice(index, 1);
      }
      // Restart the dead worker
      mediasoup.createWorker(config.mediasoup.workerSettings).then((newWorker) => {
        newWorker.on('died', () => {
          console.error(`[WorkerManager] Replacement worker ${newWorker.pid} also died`);
        });
        workers.push(newWorker);
        console.log(`[WorkerManager] Replacement worker ${newWorker.pid} started`);
      });
    });

    workers.push(worker);
    console.log(`[WorkerManager] Worker ${worker.pid} created`);
  }
}

export function getNextWorker(): Worker {
  if (workers.length === 0) {
    throw new Error('No mediasoup workers available');
  }
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

export function getWorkers(): Worker[] {
  return workers;
}

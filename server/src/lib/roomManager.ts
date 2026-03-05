import { Room } from './Room';
import { getNextWorker } from './workerManager';

const rooms: Map<string, Room> = new Map();

// Rate limiting: track room creations per IP
const createRateMap: Map<string, number[]> = new Map();

const MAX_CONCURRENT_ROOMS = 50;
const MAX_CREATES_PER_IP_PER_HOUR = 20;
const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const EMPTY_ROOM_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes if empty

function generateRoomCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const segments = [3, 4, 3];
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-');
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  let timestamps = createRateMap.get(ip) || [];
  timestamps = timestamps.filter((t) => t > hourAgo);
  createRateMap.set(ip, timestamps);

  return timestamps.length < MAX_CREATES_PER_IP_PER_HOUR;
}

function recordRoomCreation(ip: string): void {
  const timestamps = createRateMap.get(ip) || [];
  timestamps.push(Date.now());
  createRateMap.set(ip, timestamps);
}

export async function createRoom(roomId?: string, password?: string, ip?: string): Promise<Room> {
  const id = roomId || generateRoomCode();

  if (rooms.has(id)) {
    return rooms.get(id)!;
  }

  // Check concurrent room limit
  if (rooms.size >= MAX_CONCURRENT_ROOMS) {
    throw new Error('Server is at capacity. Please try again later.');
  }

  // Check rate limit
  if (ip && !checkRateLimit(ip)) {
    throw new Error('Too many rooms created. Please wait before creating another.');
  }

  const worker = getNextWorker();
  const room = await Room.create(id, worker, password);
  rooms.set(id, room);

  if (ip) {
    recordRoomCreation(ip);
  }

  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function deleteRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.close();
    rooms.delete(roomId);
    console.log(`[RoomManager] Room deleted`);
  }
}

export function getRooms(): Map<string, Room> {
  return rooms;
}

export function getRoomCount(): number {
  return rooms.size;
}

export function cleanupRooms(): void {
  const now = Date.now();

  for (const [roomId, room] of rooms) {
    const isEmpty = room.peerCount === 0;
    const age = now - room.createdAt;
    const idle = now - room.lastActivityAt;

    // Delete empty rooms after 5 minutes
    if (isEmpty && idle > EMPTY_ROOM_EXPIRY_MS) {
      console.log(`[RoomManager] Expiring empty room ${roomId} (idle ${Math.round(idle / 1000)}s)`);
      deleteRoom(roomId);
      continue;
    }

    // Delete any room older than 2 hours
    if (age > ROOM_EXPIRY_MS) {
      console.log(`[RoomManager] Expiring old room ${roomId} (age ${Math.round(age / 60000)}min)`);
      deleteRoom(roomId);
      continue;
    }
  }

  // Clean up stale rate limit entries
  const hourAgo = now - 60 * 60 * 1000;
  for (const [ip, timestamps] of createRateMap) {
    const filtered = timestamps.filter((t) => t > hourAgo);
    if (filtered.length === 0) {
      createRateMap.delete(ip);
    } else {
      createRateMap.set(ip, filtered);
    }
  }
}

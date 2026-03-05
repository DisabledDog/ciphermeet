import { Room } from './Room';
import { getNextWorker } from './workerManager';

const rooms: Map<string, Room> = new Map();

function generateRoomCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const segments = [3, 4, 3];
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-');
}

export async function createRoom(roomId?: string, password?: string): Promise<Room> {
  const id = roomId || generateRoomCode();

  if (rooms.has(id)) {
    return rooms.get(id)!;
  }

  const worker = getNextWorker();
  const room = await Room.create(id, worker, password);
  rooms.set(id, room);
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

export function cleanupEmptyRooms(): void {
  for (const [roomId, room] of rooms) {
    if (room.peerCount === 0) {
      deleteRoom(roomId);
    }
  }
}

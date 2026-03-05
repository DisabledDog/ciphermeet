import { Room } from './Room';
import { getNextWorker } from './workerManager';

const rooms: Map<string, Room> = new Map();

export async function createRoom(roomId: string): Promise<Room> {
  if (rooms.has(roomId)) {
    return rooms.get(roomId)!;
  }

  const worker = getNextWorker();
  const room = await Room.create(roomId, worker);
  rooms.set(roomId, room);
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
    console.log(`[RoomManager] Room ${roomId} deleted`);
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

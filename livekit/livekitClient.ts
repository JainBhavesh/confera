import { Room } from 'livekit-client';

export async function createLiveKitConnection(url: string, token: string) {
  const room = new Room();
  await room.connect(url, token, { autoSubscribe: true });
  return room;
}

import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedLivestream, goLive } from '@/services/livestream.service';
import { ensureRoomExists, mintLivestreamToken } from '@/lib/livekit/token';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const existing = await getOrgScopedLivestream(user.organizationId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
    }
    if (existing.createdByUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the host or an admin can go live.' }, { status: 403 });
    }
    if (existing.status === 'ENDED') {
      return NextResponse.json({ error: 'This livestream has ended.' }, { status: 400 });
    }

    const livestream = await goLive(existing);

    try {
      await ensureRoomExists(livestream.livekitRoomName);
    } catch (err) {
      console.warn('[host-join] could not pre-create LiveKit room:', (err as Error).message);
    }

    const token = await mintLivestreamToken({
      roomName: livestream.livekitRoomName,
      identity: user.id,
      name: user.name,
      canPublish: true
    });

    return NextResponse.json({
      token,
      serverUrl: process.env.LIVEKIT_WS_URL,
      roomName: livestream.livekitRoomName,
      livestream
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

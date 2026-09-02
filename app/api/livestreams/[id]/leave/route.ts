import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/guards';
import { guestLeaveSchema } from '@/lib/validation/schemas';
import { getOrgScopedLivestream, leaveLivestreamViewer, leaveLivestreamViewerAsGuest } from '@/services/livestream.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (user) {
      const livestream = await getOrgScopedLivestream(user.organizationId, id);
      if (!livestream) {
        return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
      }

      const session = await leaveLivestreamViewer(livestream.id, user.id);
      return NextResponse.json({ session });
    }

    // Guests carry no session cookie to identify them by — the client sends
    // back the sessionId it received from /join, and leaveLivestreamViewerAsGuest
    // only closes it if it's genuinely an open guest session on this livestream.
    const body = await request.json().catch(() => null);
    const parsed = guestLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const session = await leaveLivestreamViewerAsGuest(id, parsed.data.sessionId);
    return NextResponse.json({ session });
  } catch (err) {
    return toErrorResponse(err);
  }
}

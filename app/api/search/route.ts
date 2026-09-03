import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getResolvedPermissions } from '@/lib/permissions';
import { searchOrg, type SearchKind } from '@/services/search.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const permissions = await getResolvedPermissions(user);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const kind = (searchParams.get('kind') ?? 'all') as SearchKind;

    const results = await searchOrg(user.organizationId, q, kind, permissions);

    return NextResponse.json({ results });
  } catch (err) {
    return toErrorResponse(err);
  }
}

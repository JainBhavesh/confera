import { prisma } from '@/lib/db/prisma';
import type { ResolvedPermissions } from '@/lib/permissions';

export interface SearchResult {
  kind: 'SUMMARY' | 'TRANSCRIPT' | 'ACTION';
  meetingId: string;
  title: string;
  when: Date;
  snippet: string;
}

export type SearchKind = 'all' | 'SUMMARY' | 'TRANSCRIPT' | 'ACTION';

const HEADLINE_OPTS = 'MaxFragments=1, MaxWords=30, MinWords=12';

function stripHeadlineTags(text: string): string {
  return text.replace(/<\/?b>/g, '');
}

/**
 * Real Postgres full-text search across meeting summaries, transcripts, and
 * action items — no external search infra, just `to_tsvector`/`ts_headline`.
 * Gated per-kind by the caller's resolved permissions, same as the rest of
 * the meeting-detail views.
 */
export async function searchOrg(
  organizationId: string,
  query: string,
  kind: SearchKind,
  permissions: ResolvedPermissions
): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const results: SearchResult[] = [];

  if (kind === 'all' || kind === 'SUMMARY') {
    const rows = await prisma.$queryRaw<Array<{ meetingId: string; title: string; when: Date; snippet: string }>>`
      SELECT m.id as "meetingId", m.title, COALESCE(m."endedAt", m."createdAt") as "when",
             ts_headline('english', mn.summary, plainto_tsquery('english', ${q}), ${HEADLINE_OPTS}) as snippet
      FROM "MeetingNotes" mn
      JOIN "Meeting" m ON m.id = mn."meetingId"
      WHERE m."organizationId" = ${organizationId}
        AND mn.summary IS NOT NULL
        AND to_tsvector('english', mn.summary) @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank(to_tsvector('english', mn.summary), plainto_tsquery('english', ${q})) DESC
      LIMIT 20
    `;
    results.push(...rows.map((r) => ({ kind: 'SUMMARY' as const, meetingId: r.meetingId, title: r.title, when: r.when, snippet: stripHeadlineTags(r.snippet) })));
  }

  if (permissions.canViewTranscript && (kind === 'all' || kind === 'TRANSCRIPT')) {
    const rows = await prisma.$queryRaw<Array<{ meetingId: string; title: string; when: Date; snippet: string }>>`
      SELECT m.id as "meetingId", m.title, COALESCE(m."endedAt", m."createdAt") as "when",
             ts_headline('english', mn.transcript, plainto_tsquery('english', ${q}), ${HEADLINE_OPTS}) as snippet
      FROM "MeetingNotes" mn
      JOIN "Meeting" m ON m.id = mn."meetingId"
      WHERE m."organizationId" = ${organizationId}
        AND mn.transcript IS NOT NULL
        AND to_tsvector('english', mn.transcript) @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank(to_tsvector('english', mn.transcript), plainto_tsquery('english', ${q})) DESC
      LIMIT 20
    `;
    results.push(...rows.map((r) => ({ kind: 'TRANSCRIPT' as const, meetingId: r.meetingId, title: r.title, when: r.when, snippet: stripHeadlineTags(r.snippet) })));
  }

  if (permissions.canViewActionItems && (kind === 'all' || kind === 'ACTION')) {
    const rows = await prisma.$queryRaw<Array<{ meetingId: string; title: string; when: Date; snippet: string }>>`
      SELECT m.id as "meetingId", m.title, ai."createdAt" as "when",
             ts_headline('english', ai.title || '. ' || COALESCE(ai.description, ''), plainto_tsquery('english', ${q}), ${HEADLINE_OPTS}) as snippet
      FROM "ActionItem" ai
      JOIN "Meeting" m ON m.id = ai."meetingId"
      WHERE ai."organizationId" = ${organizationId}
        AND to_tsvector('english', ai.title || '. ' || COALESCE(ai.description, '')) @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank(to_tsvector('english', ai.title || '. ' || COALESCE(ai.description, '')), plainto_tsquery('english', ${q})) DESC
      LIMIT 20
    `;
    results.push(...rows.map((r) => ({ kind: 'ACTION' as const, meetingId: r.meetingId, title: r.title, when: r.when, snippet: stripHeadlineTags(r.snippet) })));
  }

  results.sort((a, b) => b.when.getTime() - a.when.getTime());
  return results;
}

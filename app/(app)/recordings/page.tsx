import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { getResolvedPermissions } from '@/lib/permissions';

interface RecordingCard {
  id: string;
  href: string;
  title: string;
  host: string;
  kind: 'AUDIO' | 'LIVESTREAM';
  when: Date;
  durationLabel: string;
}

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return '—';
  const totalSeconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default async function RecordingsPage() {
  const user = await requireUserPage();
  const permissions = await getResolvedPermissions(user);

  if (!permissions.canViewRecording) {
    return (
      <div>
        <h1 className="text-[32px] font-extrabold text-foreground">Recordings</h1>
        <p className="mt-4 text-sm text-muted-foreground">You do not have permission to view recordings.</p>
      </div>
    );
  }

  const [meetings, livestreams] = await Promise.all([
    prisma.meeting.findMany({
      where: { organizationId: user.organizationId, recordingStatus: 'READY' },
      orderBy: { endedAt: 'desc' },
      include: { createdBy: { select: { name: true } } }
    }),
    prisma.livestream.findMany({
      where: { organizationId: user.organizationId, recordingStatus: 'READY' },
      orderBy: { endedAt: 'desc' },
      include: { createdBy: { select: { name: true } } }
    })
  ]);

  const recordings: RecordingCard[] = [
    ...meetings.map((m) => ({
      id: m.id,
      href: `/meetings/${m.id}`,
      title: m.title,
      host: m.createdBy.name,
      kind: 'AUDIO' as const,
      when: m.endedAt ?? m.createdAt,
      durationLabel: formatDuration(m.startedAt, m.endedAt)
    })),
    ...livestreams.map((l) => ({
      id: l.id,
      href: `/live/${l.id}`,
      title: l.title,
      host: l.createdBy.name,
      kind: 'LIVESTREAM' as const,
      when: l.endedAt ?? l.createdAt,
      durationLabel: formatDuration(l.startedAt, l.endedAt)
    }))
  ].sort((a, b) => b.when.getTime() - a.when.getTime());

  return (
    <div>
      <div className="border-b-2 border-divider pb-5">
        <h1 className="mb-1.5 text-[32px] font-extrabold text-foreground">Recordings</h1>
        <p className="text-sm text-muted-foreground">Livestreams record video; meetings record audio for notes.</p>
      </div>

      {recordings.length === 0 ? (
        <p className="pt-8 text-sm text-muted-foreground">No recordings yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-6 pt-6">
          {recordings.map((r) => (
            <Link key={`${r.kind}-${r.id}`} href={r.href} className="group block">
              <div className="relative flex aspect-video items-center justify-center bg-[#201e1d]">
                <svg viewBox="0 0 24 24" fill="rgba(243,242,242,.85)" className="h-8 w-8">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="absolute bottom-2 right-2 bg-[#201e1d] px-1.5 py-0.5 text-[11px] text-[#f3f2f2]">
                  {r.durationLabel}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
                  {r.kind}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{r.when.toLocaleDateString()}</span>
              </div>
              <div className="mt-1.5 font-heading text-[17px] font-extrabold leading-tight text-foreground group-hover:text-primary">
                {r.title}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{r.host}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

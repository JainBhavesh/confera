import Link from 'next/link';
import { getTranslations, getFormatter } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { MeetingListTable } from '@/components/meeting/MeetingListTable';
import { ScheduleMeetingForm } from '@/components/meeting/ScheduleMeetingForm';
import { StartMeetingCard } from '@/components/meeting/StartMeetingCard';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function DashboardPage() {
  const user = await requireUserPage();
  const t = await getTranslations('dashboard');
  const format = await getFormatter();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);

  const [recentMeetings, upcomingToday, openActionItems, weekSessions, openActionsCount] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [{ createdByUserId: user.id }, { participantSessions: { some: { userId: user.id } } }]
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { createdBy: { select: { name: true } } }
    }),
    prisma.meeting.findMany({
      where: {
        organizationId: user.organizationId,
        status: { not: 'CANCELLED' },
        scheduledAt: { gte: todayStart, lte: todayEnd }
      },
      orderBy: { scheduledAt: 'asc' },
      include: { createdBy: { select: { name: true } } }
    }),
    prisma.actionItem.findMany({
      where: { organizationId: user.organizationId, assignedToUserId: user.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { meeting: { select: { title: true } } }
    }),
    prisma.meetingParticipantSession.findMany({
      where: { userId: user.id, joinedAt: { gte: weekStart } },
      select: { durationSeconds: true, meeting: { select: { notes: { select: { status: true } } } } }
    }),
    prisma.actionItem.count({
      where: { organizationId: user.organizationId, assignedToUserId: user.id, status: { in: ['PENDING', 'IN_PROGRESS'] } }
    })
  ]);

  const weekSeconds = weekSessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
  const weekHours = Math.floor(weekSeconds / 3600);
  const weekMinutes = Math.floor((weekSeconds % 3600) / 60);
  const transcribedCount = weekSessions.filter((s) => s.meeting.notes?.status === 'READY').length;

  return (
    <div>
      <div className="flex items-end justify-between gap-6 border-b-2 border-divider pb-5">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-primary">
            {format.dateTime(now, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="text-[42px] font-extrabold leading-[1.06] tracking-tight text-foreground">
            {t('greeting', {
              period: t(`periods.${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}`),
              name: user.name.split(' ')[0]
            })}
          </h1>
        </div>
        <div className="flex gap-8 pb-1.5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t('today')}</div>
            <div className="font-heading text-[25px] font-extrabold text-foreground">
              {t('meetingsCount', { count: upcomingToday.length })}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t('openActions')}</div>
            <div className="font-heading text-[25px] font-extrabold text-foreground">{openActionsCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 border-b-2 border-divider">
        <div className="border-r border-divider py-6 pr-6">
          <StartMeetingCard />
        </div>
        <div className="border-r border-divider px-6 py-6">
          <h4 className="mb-1.5 text-base font-extrabold text-foreground">{t('scheduleHeading')}</h4>
          <p className="mb-3.5 text-[13px] text-muted-foreground">{t('scheduleDescription')}</p>
          <ScheduleMeetingForm />
        </div>
        <div className="py-6 pl-6">
          <h4 className="mb-1.5 text-base font-extrabold text-foreground">{t('goLiveHeading')}</h4>
          <p className="mb-3.5 text-[13px] text-muted-foreground">{t('goLiveDescription')}</p>
          <Link
            href="/livestreams"
            className="inline-flex h-11 items-center justify-center border border-divider px-5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {t('startLivestream')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-10 pt-7">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-xl font-extrabold text-foreground">{t('upNext')}</h3>
            <Link href="/schedule" className="text-[13px] text-primary hover:opacity-80">
              {t('fullSchedule')}
            </Link>
          </div>
          {upcomingToday.length === 0 ? (
            <p className="pb-6 text-sm text-muted-foreground">{t('nothingScheduledToday')}</p>
          ) : (
            upcomingToday.map((m) => (
              <div key={m.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-4 border-b border-divider py-3.5">
                <div className="font-heading text-base font-extrabold text-foreground">
                  {m.scheduledAt ? format.dateTime(new Date(m.scheduledAt), { hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-foreground">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.createdBy.name}</div>
                </div>
                <Link
                  href={`/meet/${m.id}`}
                  className="border border-divider px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  {t('join')}
                </Link>
              </div>
            ))
          )}

          <div className="mb-3 mt-8 flex items-baseline justify-between">
            <h3 className="text-xl font-extrabold text-foreground">{t('recentMeetings')}</h3>
            <Link href="/meetings" className="text-[13px] text-primary hover:opacity-80">
              {t('viewAll')}
            </Link>
          </div>
          <MeetingListTable meetings={recentMeetings} emptyMessage={t('noMeetingsYet')} />
        </div>

        <div>
          <h3 className="mb-3 text-xl font-extrabold text-foreground">{t('yourActionItems')}</h3>
          {openActionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('nothingAssigned')}</p>
          ) : (
            openActionItems.map((a) => (
              <div key={a.id} className="flex gap-2.5 border-b border-divider py-3">
                <div className="mt-0.5 h-[15px] w-[15px] shrink-0 border-[1.5px] border-divider" />
                <div className="min-w-0">
                  <div className="text-sm leading-snug text-foreground">{a.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{a.meeting.title}</div>
                </div>
              </div>
            ))
          )}
          <Link href="/action-items" className="mt-3.5 inline-block text-[13px] text-primary hover:opacity-80">
            {t('allActionItems')}
          </Link>

          <div className="mt-8 bg-primary p-6 text-primary-foreground">
            <div className="text-[10px] uppercase tracking-[0.12em] opacity-80">{t('thisWeek')}</div>
            <div className="mt-2 font-heading text-[32px] font-extrabold leading-tight">
              {t('hoursMinutes', { hours: weekHours, minutes: weekMinutes })}
            </div>
            <div className="mt-1.5 text-[13px] opacity-85">{t('weekSummary', { count: transcribedCount })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

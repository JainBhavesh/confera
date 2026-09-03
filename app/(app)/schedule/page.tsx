import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { ScheduleMeetingForm } from '@/components/meeting/ScheduleMeetingForm';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const RECURRENCE_LABEL: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // getDay(): 0=Sun..6=Sat — shift back to the preceding Monday.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Deliberately NOT date.toISOString().slice(0, 10) — that converts to UTC,
// which rolls local midnight back a day in any timezone ahead of UTC and
// silently breaks the week math below (a "next week" Monday landing on UTC
// Sunday gets re-normalized by startOfWeek back to the *previous* Monday).
// Every date here is meant as a local calendar day, so format it as one.
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateParam(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const user = await requireUserPage();
  const { start } = await searchParams;

  const weekStart = startOfWeek(parseDateParam(start) ?? new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 5);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const isCurrentWeek = weekStart.getTime() === startOfWeek(new Date()).getTime();

  const weekEndDisplay = new Date(weekStart);
  weekEndDisplay.setDate(weekEndDisplay.getDate() + 4);
  const rangeLabel =
    weekStart.getMonth() === weekEndDisplay.getMonth()
      ? `${weekStart.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} – ${weekEndDisplay.getDate()}, ${weekEndDisplay.getFullYear()}`
      : `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEndDisplay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${weekEndDisplay.getFullYear()}`;

  const meetings = await prisma.meeting.findMany({
    where: {
      organizationId: user.organizationId,
      status: { not: 'CANCELLED' },
      scheduledAt: { gte: weekStart, lt: weekEnd }
    },
    orderBy: { scheduledAt: 'asc' },
    include: { createdBy: { select: { name: true } } }
  });

  const days = DAY_LABELS.map((label, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const items = meetings.filter((m) => m.scheduledAt && new Date(m.scheduledAt).toDateString() === date.toDateString());
    return { label, date, items };
  });

  return (
    <div>
      <div className="flex items-end justify-between border-b-2 border-divider pb-5">
        <div>
          <h1 className="text-[32px] font-extrabold text-foreground">Schedule</h1>
          <div className="mt-2 flex items-center gap-3">
            <Link
              href={`/schedule?start=${toDateParam(prevWeekStart)}`}
              aria-label="Previous week"
              className="flex h-8 w-8 items-center justify-center border border-divider text-foreground hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <Link
              href={`/schedule?start=${toDateParam(nextWeekStart)}`}
              aria-label="Next week"
              className="flex h-8 w-8 items-center justify-center border border-divider text-foreground hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
              </svg>
            </Link>
            <span className="text-sm font-medium text-foreground">{rangeLabel}</span>
            {!isCurrentWeek ? (
              <Link href="/schedule" className="text-[13px] text-primary hover:opacity-80">
                Today
              </Link>
            ) : null}
          </div>
        </div>
        <ScheduleMeetingForm />
      </div>

      <div className="grid grid-cols-5 border-b-2 border-divider">
        {days.map((day) => (
          <div key={day.label} className="min-h-[340px] border-r border-divider p-3.5 last:border-r-0">
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{day.label}</div>
            <div className="mb-3.5 mt-0.5 font-heading text-[25px] font-extrabold text-foreground">
              {day.date.getDate()}
            </div>
            {day.items.map((item) => (
              <div key={item.id} className="mb-2 border-l-[3px] border-primary bg-muted px-2.5 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{new Date(item.scheduledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {item.recurrence !== 'ONCE' ? (
                    <span className="text-primary">· {RECURRENCE_LABEL[item.recurrence]}</span>
                  ) : null}
                </div>
                <div className="text-[13px] font-semibold leading-tight text-foreground">{item.title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{item.createdBy.name}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

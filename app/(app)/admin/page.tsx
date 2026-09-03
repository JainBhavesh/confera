import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import {
  getOrgDashboardStats,
  getRecentMeetings,
  getWeeklyMeetingMinutes,
  getTranscriptionStats,
  getTopUsersByMeetingTime
} from '@/services/analytics.service';
import { Badge } from '@/components/ui/Badge';
import { OrgPolicyToggles } from '@/components/admin/OrgPolicyToggles';

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'danger' | 'muted' | 'outline'> = {
  SCHEDULED: 'outline',
  LIVE: 'success',
  ENDED: 'muted',
  CANCELLED: 'danger'
};

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();

  const [stats, recentMeetings, weeklyMinutes, transcriptionStats, topHosts, organization] = await Promise.all([
    getOrgDashboardStats(admin.organizationId),
    getRecentMeetings(admin.organizationId, 5),
    getWeeklyMeetingMinutes(admin.organizationId),
    getTranscriptionStats(admin.organizationId),
    getTopUsersByMeetingTime(admin.organizationId, 4),
    prisma.organization.findUniqueOrThrow({ where: { id: admin.organizationId } })
  ]);

  const maxMinutes = Math.max(1, ...weeklyMinutes.map((w) => w.minutes));
  const totalMeetingMinutes = Math.round(stats.meetingHoursTotal * 60);
  const transcribedPct = transcriptionStats.endedCount > 0 ? Math.round((transcriptionStats.readyCount / transcriptionStats.endedCount) * 100) : 0;
  const maxHostSeconds = Math.max(1, ...topHosts.map((h) => h.totalSeconds));

  return (
    <div>
      <div className="border-b-2 border-divider pb-5">
        <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-primary">{organization.name} · Admin</div>
        <h1 className="text-[32px] font-extrabold text-foreground">Usage analytics</h1>
      </div>

      <div className="grid grid-cols-4 border-b-2 border-divider">
        <div className="border-r border-divider py-5.5 pr-6">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Members</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{stats.totalUsers}</div>
          <div className="text-xs text-muted-foreground">{stats.activeUsers} active</div>
        </div>
        <div className="border-r border-divider px-6 py-5.5">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Meeting minutes</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{totalMeetingMinutes.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{stats.totalMeetings} meetings total</div>
        </div>
        <div className="border-r border-divider px-6 py-5.5">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Transcribed</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{transcribedPct}%</div>
          <div className="text-xs text-muted-foreground">
            {transcriptionStats.readyCount} of {transcriptionStats.endedCount} meetings
          </div>
        </div>
        <div className="py-5.5 pl-6">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Recordings</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{stats.totalRecordings}</div>
          <div className="text-xs text-muted-foreground">ready to play</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-10 pt-7">
        <div>
          <h3 className="mb-4 text-xl font-extrabold text-foreground">Meeting minutes per week</h3>
          <div className="flex h-[200px] items-end gap-4 border-b border-divider">
            {weeklyMinutes.map((w) => (
              <div key={w.weekStart} className="flex h-full flex-1 flex-col justify-end">
                <div className="mb-1.5 text-center text-[11px] text-muted-foreground">{w.minutes}</div>
                <div className="w-full bg-primary" style={{ height: `${(w.minutes / maxMinutes) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            {weeklyMinutes.map((w) => (
              <div key={w.weekStart} className="flex-1 text-center text-[11px] tracking-wide text-muted-foreground">
                {new Date(w.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            ))}
          </div>

          <h3 className="mb-3 mt-8 text-xl font-extrabold text-foreground">Most active hosts</h3>
          {topHosts.map((h) => (
            <div key={h.id} className="border-b border-divider py-3">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold text-foreground">{h.name}</span>
                <span className="ml-auto text-[13px] tabular-nums">{Math.round(h.totalSeconds / 60)} min</span>
              </div>
              <div className="mt-2 h-1 bg-muted">
                <div className="h-1 bg-primary" style={{ width: `${(h.totalSeconds / maxHostSeconds) * 100}%` }} />
              </div>
            </div>
          ))}

          <h3 className="mb-3 mt-8 text-xl font-extrabold text-foreground">Recent meetings</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-divider text-muted-foreground">
                <th className="py-2.5 pr-4 text-[11px] font-medium uppercase tracking-wide">Meeting</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Host</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Status</th>
                <th className="py-2.5 pl-4" />
              </tr>
            </thead>
            <tbody>
              {recentMeetings.map((meeting) => (
                <tr key={meeting.id} className="border-b border-divider last:border-0">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{meeting.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{meeting.hostName}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANT[meeting.status] ?? 'neutral'}>{meeting.status}</Badge>
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <Link href={`/admin/meetings/${meeting.id}`} className="text-sm text-primary hover:opacity-80">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <OrgPolicyToggles
            defaultCanGenerateNotes={organization.defaultCanGenerateNotes}
            publicMeetingsEnabled={organization.publicMeetingsEnabled}
            autoDeleteRecordingsAfterDays={organization.autoDeleteRecordingsAfterDays}
          />

          <div className="mt-7 bg-[#201e1d] p-6 text-[#f3f2f2]">
            <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">Live right now</div>
            <div className="mt-2 font-heading text-[32px] font-extrabold leading-tight">{stats.liveMeetingsNow} meetings</div>
            <div className="mt-1.5 text-[13px] opacity-75">
              {stats.liveLivestreamsNow} livestream{stats.liveLivestreamsNow === 1 ? '' : 's'}, {stats.liveViewersNow} viewers watching.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

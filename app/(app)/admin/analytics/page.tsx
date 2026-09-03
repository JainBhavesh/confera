import { requireAdminPage } from '@/lib/auth/guards';
import {
  getLivestreamViewerTrend,
  getOrgDashboardStats,
  getTopUsersByMeetingTime,
  getUsageOverTime
} from '@/services/analytics.service';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-muted">
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const admin = await requireAdminPage();

  const [stats, usageOverTime, topUsers, viewerTrend] = await Promise.all([
    getOrgDashboardStats(admin.organizationId),
    getUsageOverTime(admin.organizationId),
    getTopUsersByMeetingTime(admin.organizationId),
    getLivestreamViewerTrend(admin.organizationId)
  ]);

  const maxMeetingsPerDay = Math.max(1, ...usageOverTime.map((p) => p.meetings));
  const maxSeconds = Math.max(1, ...topUsers.map((u) => u.totalSeconds));
  const maxViewersPerDay = Math.max(1, ...viewerTrend.map((p) => p.viewers));

  return (
    <div>
      <div className="border-b-2 border-divider pb-5">
        <h1 className="mb-1.5 text-[32px] font-extrabold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Usage trends across your organization over the last 30 days.</p>
      </div>

      <div className="grid grid-cols-4 border-b-2 border-divider">
        <div className="border-r border-divider py-5.5 pr-6">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Total meetings</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{stats.totalMeetings}</div>
        </div>
        <div className="border-r border-divider px-6 py-5.5">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Meeting hours</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{stats.meetingHoursTotal}h</div>
        </div>
        <div className="border-r border-divider px-6 py-5.5">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Total livestreams</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{stats.totalLivestreams}</div>
        </div>
        <div className="py-5.5 pl-6">
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Total recordings</div>
          <div className="mt-1.5 font-heading text-[32px] font-extrabold text-foreground">{stats.totalRecordings}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 pt-7">
        <div>
          <h3 className="mb-3 text-xl font-extrabold text-foreground">Meetings created per day</h3>
          {usageOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings in this period yet.</p>
          ) : (
            <div className="space-y-3">
              {usageOverTime.map((point) => (
                <div key={point.date} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">{point.date}</span>
                  <Bar value={point.meetings} max={maxMeetingsPerDay} />
                  <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{point.meetings}</span>
                </div>
              ))}
            </div>
          )}

          <h3 className="mb-3 mt-8 text-xl font-extrabold text-foreground">Livestream viewers per day</h3>
          {viewerTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground">No livestream views in this period yet.</p>
          ) : (
            <div className="space-y-3">
              {viewerTrend.map((point) => (
                <div key={point.date} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">{point.date}</span>
                  <Bar value={point.viewers} max={maxViewersPerDay} />
                  <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{point.viewers}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-xl font-extrabold text-foreground">Top users by meeting time</h3>
          {topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meeting activity yet.</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-foreground">{user.name}</span>
                  <Bar value={user.totalSeconds} max={maxSeconds} />
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{formatDuration(user.totalSeconds)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { requireAdminPage } from '@/lib/auth/guards';
import {
  getLivestreamViewerTrend,
  getOrgDashboardStats,
  getTopUsersByMeetingTime,
  getUsageOverTime
} from '@/services/analytics.service';
import { Card } from '@/components/ui/Card';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-2 text-muted-foreground">Usage trends across your organization over the last 30 days.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total meetings</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{stats.totalMeetings}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Meeting hours</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{stats.meetingHoursTotal}h</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total livestreams</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{stats.totalLivestreams}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total recordings</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{stats.totalRecordings}</p>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Meetings created per day</h2>
        {usageOverTime.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No meetings in this period yet.</Card>
        ) : (
          <Card className="space-y-3 p-6">
            {usageOverTime.map((point) => (
              <div key={point.date} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{point.date}</span>
                <Bar value={point.meetings} max={maxMeetingsPerDay} />
                <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{point.meetings}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Top users by meeting time</h2>
        {topUsers.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No meeting activity yet.</Card>
        ) : (
          <Card className="space-y-3 p-6">
            {topUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-foreground">{user.name}</span>
                <Bar value={user.totalSeconds} max={maxSeconds} />
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{formatDuration(user.totalSeconds)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Livestream viewers per day</h2>
        {viewerTrend.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No livestream views in this period yet.</Card>
        ) : (
          <Card className="space-y-3 p-6">
            {viewerTrend.map((point) => (
              <div key={point.date} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{point.date}</span>
                <Bar value={point.viewers} max={maxViewersPerDay} />
                <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{point.viewers}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

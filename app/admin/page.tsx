import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/guards';
import { getOrgDashboardStats, getRecentMeetings, getUserAnalytics } from '@/services/analytics.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'danger' | 'muted'> = {
  SCHEDULED: 'neutral',
  LIVE: 'success',
  ENDED: 'muted',
  CANCELLED: 'danger'
};

function formatHours(hours: number): string {
  return `${hours}h`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();

  const [stats, recentMeetings, userAnalytics] = await Promise.all([
    getOrgDashboardStats(admin.organizationId),
    getRecentMeetings(admin.organizationId),
    getUserAnalytics(admin.organizationId)
  ]);

  const kpis = [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Active users', value: stats.activeUsers },
    { label: 'Total meetings', value: stats.totalMeetings },
    { label: 'Live now', value: stats.liveMeetingsNow },
    { label: 'Meeting hours', value: formatHours(stats.meetingHoursTotal) },
    { label: 'Total livestreams', value: stats.totalLivestreams },
    { label: 'Live viewers now', value: stats.liveViewersNow },
    { label: 'Total recordings', value: stats.totalRecordings },
    { label: 'Pending action items', value: stats.pendingActionItems }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-foreground">Admin dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Recent meetings</h2>
        {recentMeetings.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No meetings yet.</Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Meeting</th>
                  <th className="px-5 py-3 font-medium">Host</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Participants</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {recentMeetings.map((meeting) => (
                  <tr key={meeting.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-foreground">{meeting.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{meeting.hostName}</td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_VARIANT[meeting.status] ?? 'neutral'}>{meeting.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{meeting.participantCount}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(meeting.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/meetings/${meeting.id}`} className="text-sm text-primary hover:opacity-80">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">User analytics</h2>
        {userAnalytics.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No users yet.</Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Meetings</th>
                  <th className="px-5 py-3 font-medium">Total time</th>
                  <th className="px-5 py-3 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {userAnalytics.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-foreground">{user.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{user.meetingCount}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDuration(user.totalSeconds)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

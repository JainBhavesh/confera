import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { Card } from '@/components/ui/Card';

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();

  const [totalUsers, activeUsers, totalMeetings, liveMeetings] = await Promise.all([
    prisma.user.count({ where: { organizationId: admin.organizationId } }),
    prisma.user.count({ where: { organizationId: admin.organizationId, isActive: true } }),
    prisma.meeting.count({ where: { organizationId: admin.organizationId } }),
    prisma.meeting.count({ where: { organizationId: admin.organizationId, status: 'LIVE' } })
  ]);

  const stats = [
    { label: 'Total users', value: totalUsers },
    { label: 'Active users', value: activeUsers },
    { label: 'Total meetings', value: totalMeetings },
    { label: 'Live now', value: liveMeetings }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

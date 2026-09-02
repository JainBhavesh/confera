import { prisma } from '@/lib/db/prisma';

export interface OrgDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMeetings: number;
  liveMeetingsNow: number;
  meetingHoursTotal: number;
  totalLivestreams: number;
  liveViewersNow: number;
  totalRecordings: number;
  pendingActionItems: number;
}

export async function getOrgDashboardStats(organizationId: string): Promise<OrgDashboardStats> {
  const [
    totalUsers,
    activeUsers,
    totalMeetings,
    liveMeetingsNow,
    durationAgg,
    totalLivestreams,
    liveViewersNow,
    recordedMeetings,
    recordedLivestreams,
    pendingActionItems
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId } }),
    prisma.user.count({ where: { organizationId, isActive: true } }),
    prisma.meeting.count({ where: { organizationId } }),
    prisma.meeting.count({ where: { organizationId, status: 'LIVE' } }),
    prisma.meetingParticipantSession.aggregate({
      _sum: { durationSeconds: true },
      where: { meeting: { organizationId } }
    }),
    prisma.livestream.count({ where: { organizationId } }),
    prisma.livestreamViewerSession.count({ where: { leftAt: null, livestream: { organizationId, status: 'LIVE' } } }),
    prisma.meeting.count({ where: { organizationId, recordingStatus: 'READY' } }),
    prisma.livestream.count({ where: { organizationId, recordingStatus: 'READY' } }),
    prisma.actionItem.count({ where: { organizationId, status: { in: ['PENDING', 'IN_PROGRESS'] } } })
  ]);

  return {
    totalUsers,
    activeUsers,
    totalMeetings,
    liveMeetingsNow,
    meetingHoursTotal: Math.round(((durationAgg._sum.durationSeconds ?? 0) / 3600) * 10) / 10,
    totalLivestreams,
    liveViewersNow,
    totalRecordings: recordedMeetings + recordedLivestreams,
    pendingActionItems
  };
}

export interface RecentMeetingItem {
  id: string;
  title: string;
  hostName: string;
  status: string;
  participantCount: number;
  createdAt: Date;
}

export async function getRecentMeetings(organizationId: string, limit = 10): Promise<RecentMeetingItem[]> {
  const meetings = await prisma.meeting.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { createdBy: { select: { name: true } }, _count: { select: { participantSessions: true } } }
  });

  return meetings.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    hostName: meeting.createdBy.name,
    status: meeting.status,
    participantCount: meeting._count.participantSessions,
    createdAt: meeting.createdAt
  }));
}

export interface UserAnalyticsItem {
  id: string;
  name: string;
  meetingCount: number;
  totalSeconds: number;
  lastActiveAt: Date | null;
}

export async function getUserAnalytics(organizationId: string, limit = 20): Promise<UserAnalyticsItem[]> {
  const users = await prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, name: true }
  });

  if (users.length === 0) return [];

  const sessionStats = await prisma.meetingParticipantSession.groupBy({
    by: ['userId'],
    where: { meeting: { organizationId }, userId: { in: users.map((u) => u.id) } },
    _count: { _all: true },
    _sum: { durationSeconds: true },
    _max: { joinedAt: true }
  });

  const byUser = new Map(sessionStats.map((s) => [s.userId, s]));

  return users.map((u) => {
    const stats = byUser.get(u.id);
    return {
      id: u.id,
      name: u.name,
      meetingCount: stats?._count._all ?? 0,
      totalSeconds: stats?._sum.durationSeconds ?? 0,
      lastActiveAt: stats?._max.joinedAt ?? null
    };
  });
}

export interface DailyUsagePoint {
  date: string;
  meetings: number;
}

/** Postgres-specific day-bucketed count — acceptable since the datasource is locked to postgresql. */
export async function getUsageOverTime(organizationId: string, days = 30): Promise<DailyUsagePoint[]> {
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
    FROM "Meeting"
    WHERE "organizationId" = ${organizationId}
      AND "createdAt" >= NOW() - (${days}::int * INTERVAL '1 day')
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((row) => ({ date: row.day.toISOString().slice(0, 10), meetings: Number(row.count) }));
}

export interface TopUserItem {
  id: string;
  name: string;
  totalSeconds: number;
}

export async function getTopUsersByMeetingTime(organizationId: string, limit = 10): Promise<TopUserItem[]> {
  const grouped = await prisma.meetingParticipantSession.groupBy({
    by: ['userId'],
    where: { meeting: { organizationId }, userId: { not: null } },
    _sum: { durationSeconds: true },
    orderBy: { _sum: { durationSeconds: 'desc' } },
    take: limit
  });

  const userIds = grouped.map((g) => g.userId).filter((id): id is string => id !== null);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return grouped
    .filter((g): g is typeof g & { userId: string } => g.userId !== null)
    .map((g) => ({
      id: g.userId,
      name: nameById.get(g.userId) ?? 'Unknown',
      totalSeconds: g._sum.durationSeconds ?? 0
    }));
}

export interface LivestreamViewerTrendPoint {
  date: string;
  viewers: number;
}

export async function getLivestreamViewerTrend(organizationId: string, days = 30): Promise<LivestreamViewerTrendPoint[]> {
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', lvs."joinedAt") AS day, COUNT(*)::bigint AS count
    FROM "LivestreamViewerSession" lvs
    JOIN "Livestream" l ON l.id = lvs."livestreamId"
    WHERE l."organizationId" = ${organizationId}
      AND lvs."joinedAt" >= NOW() - (${days}::int * INTERVAL '1 day')
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((row) => ({ date: row.day.toISOString().slice(0, 10), viewers: Number(row.count) }));
}

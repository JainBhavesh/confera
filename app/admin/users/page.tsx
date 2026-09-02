import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { toPublicUser } from '@/services/user.service';
import { UserManagement } from '@/components/admin/UserManagement';

export default async function AdminUsersPage() {
  const admin = await requireAdminPage();

  const [users, organization] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: admin.organizationId },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.organization.findUniqueOrThrow({ where: { id: admin.organizationId } })
  ]);

  return (
    <UserManagement
      initialUsers={users.map(toPublicUser)}
      currentUserId={admin.id}
      defaultPermissions={{
        canCreateMeeting: organization.defaultCanCreateMeeting,
        canCreateLivestream: organization.defaultCanCreateLivestream,
        canGenerateNotes: organization.defaultCanGenerateNotes,
        canViewTranscript: organization.defaultCanViewTranscript,
        canViewActionItems: organization.defaultCanViewActionItems,
        canViewRecording: organization.defaultCanViewRecording
      }}
    />
  );
}

import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { SettingsForm } from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const admin = await requireAdminPage();
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: admin.organizationId } });

  return (
    <SettingsForm
      organizationName={organization.name}
      initialRegistrationEnabled={organization.registrationEnabled}
      initialPublicMeetingsEnabled={organization.publicMeetingsEnabled}
      initialDefaultPermissions={{
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

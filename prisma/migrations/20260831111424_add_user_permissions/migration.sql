-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "defaultCanCreateLivestream" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultCanCreateMeeting" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultCanGenerateNotes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultCanViewActionItems" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultCanViewTranscript" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canCreateLivestream" BOOLEAN,
ADD COLUMN     "canCreateMeeting" BOOLEAN,
ADD COLUMN     "canGenerateNotes" BOOLEAN,
ADD COLUMN     "canViewActionItems" BOOLEAN,
ADD COLUMN     "canViewTranscript" BOOLEAN;

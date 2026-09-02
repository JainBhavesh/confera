-- DropForeignKey
ALTER TABLE "MeetingParticipantSession" DROP CONSTRAINT "MeetingParticipantSession_userId_fkey";

-- AlterTable
ALTER TABLE "MeetingParticipantSession" ADD COLUMN     "guestName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "publicMeetingsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "MeetingParticipantSession" ADD CONSTRAINT "MeetingParticipantSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

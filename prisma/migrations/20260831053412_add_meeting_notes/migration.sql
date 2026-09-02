-- CreateEnum
CREATE TYPE "MeetingNotesStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "MeetingNotes" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "status" "MeetingNotesStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT,
    "actionItems" JSONB,
    "error" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingNotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingNotes_meetingId_key" ON "MeetingNotes"("meetingId");

-- AddForeignKey
ALTER TABLE "MeetingNotes" ADD CONSTRAINT "MeetingNotes_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

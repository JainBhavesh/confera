-- CreateEnum
CREATE TYPE "MeetingRecurrence" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "recurrence" "MeetingRecurrence" NOT NULL DEFAULT 'ONCE';

-- CreateTable
CREATE TABLE "MeetingInvite" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingInvite_meetingId_idx" ON "MeetingInvite"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingInvite_userId_idx" ON "MeetingInvite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingInvite_meetingId_email_key" ON "MeetingInvite"("meetingId", "email");

-- AddForeignKey
ALTER TABLE "MeetingInvite" ADD CONSTRAINT "MeetingInvite_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInvite" ADD CONSTRAINT "MeetingInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

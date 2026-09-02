/*
  Warnings:

  - You are about to drop the column `actionItems` on the `MeetingNotes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionItemSource" AS ENUM ('AI', 'MANUAL');

-- AlterTable
ALTER TABLE "MeetingNotes" DROP COLUMN "actionItems",
ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "defaultCanViewRecording" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canViewRecording" BOOLEAN;

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING',
    "source" "ActionItemSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionItem_organizationId_idx" ON "ActionItem"("organizationId");

-- CreateIndex
CREATE INDEX "ActionItem_meetingId_idx" ON "ActionItem"("meetingId");

-- CreateIndex
CREATE INDEX "ActionItem_assignedToUserId_idx" ON "ActionItem"("assignedToUserId");

-- CreateIndex
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

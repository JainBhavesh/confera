-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "autoDeleteRecordingsAfterDays" INTEGER;

-- CreateIndex
CREATE INDEX "ActionItem_createdByUserId_idx" ON "ActionItem"("createdByUserId");

-- CreateIndex
CREATE INDEX "Meeting_scheduledAt_idx" ON "Meeting"("scheduledAt");

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: attribute existing action items to their meeting's host, since
-- there's no real creator on record for rows added before this column
-- existed. Best-effort so "created by me" isn't empty for historical data.
UPDATE "ActionItem" ai
SET "createdByUserId" = m."createdByUserId"
FROM "Meeting" m
WHERE ai."meetingId" = m.id
  AND ai."createdByUserId" IS NULL;

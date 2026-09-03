-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "recurringGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Meeting_recurringGroupId_idx" ON "Meeting"("recurringGroupId");

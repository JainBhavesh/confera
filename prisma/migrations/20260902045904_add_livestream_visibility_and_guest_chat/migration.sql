-- CreateEnum
CREATE TYPE "LivestreamVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- DropForeignKey
ALTER TABLE "LivestreamMessage" DROP CONSTRAINT "LivestreamMessage_userId_fkey";

-- AlterTable
ALTER TABLE "Livestream" ADD COLUMN     "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visibility" "LivestreamVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "LivestreamMessage" ADD COLUMN     "guestName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LivestreamViewerSession" (
    "id" TEXT NOT NULL,
    "livestreamId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivestreamViewerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LivestreamViewerSession_livestreamId_idx" ON "LivestreamViewerSession"("livestreamId");

-- CreateIndex
CREATE INDEX "LivestreamViewerSession_userId_idx" ON "LivestreamViewerSession"("userId");

-- AddForeignKey
ALTER TABLE "LivestreamMessage" ADD CONSTRAINT "LivestreamMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestreamViewerSession" ADD CONSTRAINT "LivestreamViewerSession_livestreamId_fkey" FOREIGN KEY ("livestreamId") REFERENCES "Livestream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestreamViewerSession" ADD CONSTRAINT "LivestreamViewerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

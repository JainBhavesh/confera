-- CreateEnum
CREATE TYPE "LivestreamStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

-- CreateTable
CREATE TABLE "Livestream" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "LivestreamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "livekitRoomName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livestream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivestreamMessage" (
    "id" TEXT NOT NULL,
    "livestreamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivestreamMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Livestream_livekitRoomName_key" ON "Livestream"("livekitRoomName");

-- CreateIndex
CREATE INDEX "Livestream_organizationId_idx" ON "Livestream"("organizationId");

-- CreateIndex
CREATE INDEX "Livestream_createdByUserId_idx" ON "Livestream"("createdByUserId");

-- CreateIndex
CREATE INDEX "Livestream_status_idx" ON "Livestream"("status");

-- CreateIndex
CREATE INDEX "LivestreamMessage_livestreamId_createdAt_idx" ON "LivestreamMessage"("livestreamId", "createdAt");

-- AddForeignKey
ALTER TABLE "Livestream" ADD CONSTRAINT "Livestream_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livestream" ADD CONSTRAINT "Livestream_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestreamMessage" ADD CONSTRAINT "LivestreamMessage_livestreamId_fkey" FOREIGN KEY ("livestreamId") REFERENCES "Livestream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestreamMessage" ADD CONSTRAINT "LivestreamMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('NONE', 'RECORDING', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Livestream" ADD COLUMN     "egressId" TEXT,
ADD COLUMN     "recordingKey" TEXT,
ADD COLUMN     "recordingStatus" "RecordingStatus" NOT NULL DEFAULT 'NONE';

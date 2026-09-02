-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "recordingKey" TEXT,
ADD COLUMN     "recordingStatus" "RecordingStatus" NOT NULL DEFAULT 'NONE';

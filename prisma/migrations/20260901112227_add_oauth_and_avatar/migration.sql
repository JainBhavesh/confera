
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "oauthId" TEXT,
ADD COLUMN     "oauthProvider" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_oauthProvider_oauthId_key" ON "User"("oauthProvider", "oauthId");


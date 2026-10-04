-- AlterTable
ALTER TABLE "summary" ADD COLUMN     "preview" TEXT;

-- CreateIndex
CREATE INDEX "summary_userId_status_createdAt_idx" ON "summary"("userId", "status", "createdAt");

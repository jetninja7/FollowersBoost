-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "stripeEventId" TEXT,
ADD COLUMN     "failureMessage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_stripeEventId_key" ON "Transaction"("stripeEventId");

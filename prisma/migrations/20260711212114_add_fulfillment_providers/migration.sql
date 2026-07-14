-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('API', 'MANUAL', 'CUSTOM');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "lastRetryAt" TIMESTAMP(3),
ADD COLUMN     "providerOrderId" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "apiUrl" TEXT,
    "credentials" JSONB,
    "settings" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastHealthCheck" TIMESTAMP(3),
    "isHealthy" BOOLEAN NOT NULL DEFAULT true,
    "lastSuccessfulCall" TIMESTAMP(3),
    "lastFailedCall" TIMESTAMP(3),
    "errorRate" DECIMAL(5,4) NOT NULL DEFAULT 0.00,
    "averageResponseTime" INTEGER,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "successfulOrders" INTEGER NOT NULL DEFAULT 0,
    "failedOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderService" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "providerServiceId" TEXT NOT NULL,
    "minQuantity" INTEGER,
    "maxQuantity" INTEGER,
    "pricePerUnit" DECIMAL(10,4),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE INDEX "Provider_isEnabled_priority_idx" ON "Provider"("isEnabled", "priority" DESC);

-- CreateIndex
CREATE INDEX "Provider_slug_idx" ON "Provider"("slug");

-- CreateIndex
CREATE INDEX "ProviderService_providerId_isEnabled_idx" ON "ProviderService"("providerId", "isEnabled");

-- CreateIndex
CREATE INDEX "ProviderService_serviceId_idx" ON "ProviderService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderService_providerId_serviceId_key" ON "ProviderService"("providerId", "serviceId");

-- CreateIndex
CREATE INDEX "Order_fulfillmentProviderId_idx" ON "Order"("fulfillmentProviderId");

-- CreateIndex
CREATE INDEX "Order_providerOrderId_idx" ON "Order"("providerOrderId");

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

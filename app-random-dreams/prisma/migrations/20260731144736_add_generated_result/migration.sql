-- CreateEnum
CREATE TYPE "AiResponseStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'ERROR');

-- CreateTable
CREATE TABLE "GeneratedResult" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "aiRequestPayload" JSONB NOT NULL,
    "aiResponseStatus" "AiResponseStatus" NOT NULL DEFAULT 'QUEUED',
    "textFileName" TEXT,
    "textContent" TEXT,
    "textFileUrl" TEXT,
    "imageFileName" TEXT,
    "imageBytes" BYTEA,
    "imageFileUrl" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedResult_orderId_key" ON "GeneratedResult"("orderId");

-- CreateIndex
CREATE INDEX "GeneratedResult_aiResponseStatus_idx" ON "GeneratedResult"("aiResponseStatus");

-- CreateIndex
CREATE INDEX "GeneratedResult_productId_idx" ON "GeneratedResult"("productId");

-- AddForeignKey
ALTER TABLE "GeneratedResult" ADD CONSTRAINT "GeneratedResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedResult" ADD CONSTRAINT "GeneratedResult_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

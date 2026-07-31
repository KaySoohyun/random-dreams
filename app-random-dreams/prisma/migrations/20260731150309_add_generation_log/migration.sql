-- CreateEnum
CREATE TYPE "PipelineStep" AS ENUM ('GENERATE_TEXT', 'GENERATE_IMAGE', 'UPLOAD_RESULT', 'MARK_COMPLETED');

-- CreateEnum
CREATE TYPE "PipelineStepStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "step" "PipelineStep" NOT NULL,
    "status" "PipelineStepStatus" NOT NULL,
    "payload" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationLog_orderId_createdAt_idx" ON "GenerationLog"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationLog_step_idx" ON "GenerationLog"("step");

-- AddForeignKey
ALTER TABLE "GenerationLog" ADD CONSTRAINT "GenerationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

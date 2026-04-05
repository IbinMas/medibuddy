-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "medium" "NotificationMedium" NOT NULL,
    "providerId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationLog_providerId_key" ON "CommunicationLog"("providerId");

-- CreateIndex
CREATE INDEX "CommunicationLog_pharmacyId_createdAt_idx" ON "CommunicationLog"("pharmacyId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationLog_patientId_createdAt_idx" ON "CommunicationLog"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationLog_providerId_idx" ON "CommunicationLog"("providerId");

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

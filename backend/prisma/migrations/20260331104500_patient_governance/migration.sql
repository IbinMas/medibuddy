-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "allergiesEncrypted" TEXT,
ADD COLUMN "notesEncrypted" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

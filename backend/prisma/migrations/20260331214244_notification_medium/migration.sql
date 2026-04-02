-- CreateEnum
CREATE TYPE "NotificationMedium" AS ENUM ('NONE', 'SMS', 'WHATSAPP');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "notificationMedium" "NotificationMedium" NOT NULL DEFAULT 'NONE';

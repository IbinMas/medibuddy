/*
  Warnings:

  - You are about to drop the column `nameEncrypted` on the `Patient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "nameEncrypted",
ADD COLUMN     "firstNameEncrypted" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastNameEncrypted" TEXT NOT NULL DEFAULT '';

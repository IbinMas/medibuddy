-- CreateEnum
CREATE TYPE "MealTiming" AS ENUM ('BEFORE_MEAL', 'AFTER_MEAL');

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "mealTiming" "MealTiming";

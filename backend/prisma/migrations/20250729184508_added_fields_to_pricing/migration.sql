/*
  Warnings:

  - Added the required column `distanceMultiplier` to the `pricing_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weightMultiplier` to the `pricing_rules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pricing_rules"
ADD COLUMN "distanceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "weightMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
ALTER COLUMN "costPerKm" DROP DEFAULT,
ALTER COLUMN "costPerKg" DROP DEFAULT,
ALTER COLUMN "isActive" DROP DEFAULT;

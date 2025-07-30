/*
  Warnings:

  - You are about to drop the `ResetPasswordCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `package_status_history` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `attemptNumber` to the `delivery_attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `location_updates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ResetPasswordCode" DROP CONSTRAINT "ResetPasswordCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationCode" DROP CONSTRAINT "VerificationCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "package_status_history" DROP CONSTRAINT "package_status_history_packageId_fkey";

-- AlterTable
ALTER TABLE "delivery_attempts" ADD COLUMN     "attemptNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "location_updates" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ResetPasswordCode";

-- DropTable
DROP TABLE "VerificationCode";

-- DropTable
DROP TABLE "package_status_history";

-- CreateTable
CREATE TABLE "PackageStatusHistory" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "location" TEXT,

    CONSTRAINT "PackageStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PackageStatusHistory" ADD CONSTRAINT "PackageStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageStatusHistory" ADD CONSTRAINT "PackageStatusHistory_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

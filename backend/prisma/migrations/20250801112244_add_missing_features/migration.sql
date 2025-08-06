/*
  Warnings:

  - You are about to drop the column `createdAt` on the `location_updates` table. All the data in the column will be lost.
  - You are about to alter the column `rating` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - Added the required column `updatedAt` to the `contact_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "location_updates" DROP CONSTRAINT "location_updates_courierId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_userId_fkey";

-- AlterTable
ALTER TABLE "contact_submissions" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "location_updates" DROP COLUMN "createdAt",
ALTER COLUMN "courierId" DROP NOT NULL,
ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "rating" SET DATA TYPE SMALLINT;

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL,
    "notes" TEXT,
    "updatedBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LocationUpdateToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationUpdateToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LocationUpdateToUser_B_index" ON "_LocationUpdateToUser"("B");

-- AddForeignKey
ALTER TABLE "location_updates" ADD CONSTRAINT "location_updates_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationUpdateToUser" ADD CONSTRAINT "_LocationUpdateToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "location_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationUpdateToUser" ADD CONSTRAINT "_LocationUpdateToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

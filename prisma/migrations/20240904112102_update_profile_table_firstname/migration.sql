/*
  Warnings:

  - You are about to drop the column `description` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "description",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "privateProfile" BOOLEAN NOT NULL DEFAULT false;

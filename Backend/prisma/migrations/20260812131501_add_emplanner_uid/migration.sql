/*
  Warnings:

  - A unique constraint covering the columns `[emplannerUid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emplannerUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emplannerUid_key" ON "User"("emplannerUid");

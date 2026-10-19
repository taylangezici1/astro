/*
  Warnings:

  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "UserProfile";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "birthLocalDate" TEXT NOT NULL,
    "birthLocalTime" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "birthTimezone" TEXT NOT NULL,
    "birthUtc" TIMESTAMP(3) NOT NULL,
    "districtId" TEXT,
    "natalSun" DOUBLE PRECISION NOT NULL,
    "natalMoon" DOUBLE PRECISION NOT NULL,
    "natalMercury" DOUBLE PRECISION NOT NULL,
    "natalVenus" DOUBLE PRECISION NOT NULL,
    "natalMars" DOUBLE PRECISION NOT NULL,
    "natalJupiter" DOUBLE PRECISION NOT NULL,
    "natalSaturn" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

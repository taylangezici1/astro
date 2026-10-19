-- CreateTable
CREATE TABLE "GlobalSky" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "sun" DOUBLE PRECISION NOT NULL,
    "moon" DOUBLE PRECISION NOT NULL,
    "mercury" DOUBLE PRECISION NOT NULL,
    "venus" DOUBLE PRECISION NOT NULL,
    "mars" DOUBLE PRECISION NOT NULL,
    "jupiter" DOUBLE PRECISION NOT NULL,
    "saturn" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GlobalSky_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "birthTimestamp" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "natalSun" DOUBLE PRECISION NOT NULL,
    "natalMoon" DOUBLE PRECISION NOT NULL,
    "natalMercury" DOUBLE PRECISION NOT NULL,
    "natalVenus" DOUBLE PRECISION NOT NULL,
    "natalMars" DOUBLE PRECISION NOT NULL,
    "natalJupiter" DOUBLE PRECISION NOT NULL,
    "natalSaturn" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalSky_timestamp_key" ON "GlobalSky"("timestamp");

-- CreateIndex
CREATE INDEX "GlobalSky_sun_moon_venus_mars_idx" ON "GlobalSky"("sun", "moon", "venus", "mars");

-- CreateIndex
CREATE INDEX "GlobalSky_venus_idx" ON "GlobalSky"("venus");

-- CreateIndex
CREATE INDEX "GlobalSky_mars_idx" ON "GlobalSky"("mars");

-- CreateIndex
CREATE INDEX "GlobalSky_sun_idx" ON "GlobalSky"("sun");

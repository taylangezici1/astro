-- DropIndex
DROP INDEX "GlobalSky_sun_moon_venus_mars_idx";

-- CreateIndex
CREATE INDEX "GlobalSky_moon_idx" ON "GlobalSky"("moon");

-- CreateIndex
CREATE INDEX "GlobalSky_mercury_idx" ON "GlobalSky"("mercury");

-- CreateIndex
CREATE INDEX "GlobalSky_jupiter_idx" ON "GlobalSky"("jupiter");

-- CreateIndex
CREATE INDEX "GlobalSky_saturn_idx" ON "GlobalSky"("saturn");

This guide outlines the technical architecture for **"Project Synastry"**—a theoretical matching engine built with **Expo**, **Prisma**, and **PostgreSQL**. The goal is to identify "Perfect Match" profiles from a 40-year historical window within Türkiye using a hybrid data strategy.

---

## 1. Core Data Strategy: The "Sky-Earth" Split

To avoid a billion-row database bottleneck, the app separates **Global Astronomical Data** from **Local Geographical Data**.

### A. The "Global Sky" (Primary Index)

- **Source:** Swiss Ephemeris (`swisseph`).
- **Resolution:** Every 15 minutes for the last 40 years.
- **Scale:** $\approx 1.4$ million rows.
- **Content:** The exact degree (0–360) of the Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn.
- **Rule:** This table is the "Universal Truth." A planet's degree at a specific UTC timestamp is the same everywhere on Earth.

### B. The "Local Houses" (Secondary Calculation)

- **Rule:** **Do not pre-calculate this for the whole database.**
- **Process:** Only calculate "Houses" (where a planet falls in a specific life area) once the "Global Sky" search has narrowed the results down to a shortlist.
- **Implementation:** Use the `swe_houses()` function on-the-fly for the top-scoring timestamp results.

---

## 2. Database Schema (Prisma)

The PostgreSQL schema must be optimized for range queries on planetary degrees.

```typescript
// schema.prisma

model GlobalSky {
  id        Int      @id @default(autoincrement())
  timestamp DateTime @unique // Increments of 15 mins (UTC)
  sun       Float
  moon      Float
  mercury   Float
  venus     Float
  mars      Float
  jupiter   Float
  saturn    Float

  @@index([sun, moon, venus, mars]) // Crucial for search speed
}

model UserProfile {
  id              String   @id @default(cuid())
  birthTimestamp  DateTime
  latitude        Float
  longitude       Float
  // Store the user's specific natal degrees here after calculation
  natalSun        Float
  natalVenus      Float
  // ... etc
}
```

---

## 3. The "Golden Degree" Logic

The engine finds matches by calculating **Target Degrees** based on the user's natal chart.

1.  **Select the Aspect:** Choose a "Harmonious" angle (e.g., Trine = 120°, Conjunction = 0°).
2.  **Calculate the Target:** If User A has Venus at 150°, the Golden Degree for a partner’s Sun is $150 \pm 120 \pmod{360}$.
3.  **Define the "Orb":** Use a buffer (e.g., $\pm 3^{\circ}$). The query searches for anyone with a planet between 267° and 273°.

---

## 4. The Matching Pipeline (The "Rules")

### Phase 1: Seeding

- Run a Node.js worker script using `swisseph`.
- Iterate from 1985 to 2025 in 15-minute steps.
- Populate the `GlobalSky` table.

### Phase 2: The Global Search (The Fast Filter)

When a user requests a match:

1.  Calculate User A’s natal positions.
2.  Generate a PostgreSQL query against `GlobalSky` looking for rows where `venus`, `mars`, and `sun` hit the "Golden Degrees."
3.  Limit results to the top 1,000 timestamps.

### Phase 3: The Local Refinement (The House Filter)

For the 1,000 timestamps found:

1.  Iterate through a predefined list of **Türkiye’s 973 districts**.
2.  Calculate the **Ascendant** and **House Cusps** for each `(timestamp, district_coords)` pair.
3.  Apply "House Rules" (e.g., "Does the partner's Venus fall in User A's 7th House?").
4.  Rank and return the top theoretical "Soulmate Profile."

---

## 5. Technical Constraints & Performance

- **Expo/Frontend:** The mobile app should only handle UI and input. All heavy lifting (Ephemeris math) must stay on the **NestJS/PostgreSQL** backend.
- **Precision:** Use `Float` in Prisma to maintain arc-minute accuracy.
- **Caching:** Cache the "Golden Degree" results for 24 hours. If a user asks for a match again, don't re-run the 1.4M row query.
- **Scalability:** Because the `GlobalSky` table is static (history doesn't change), it can be heavily indexed and even placed in a Read Replica.

## 6. Project Vision

The app currently functions as a **"What If" Generator**. It tells the user: _"The person who fits your energy perfectly was born on October 12, 1994, at 14:15 in İzmir."_ In the future, this can be linked to a real user database to find actual people born at those times.

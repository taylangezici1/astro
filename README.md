# Synastry

A theoretical matching engine. From your birth date, time and place it finds
the moment — and the Turkish district — where someone who fits your chart best
would have been born in the last 40 years: _"Your match was born on 4 May 2022
at 04:00 in Akören, Konya."_

- **Spec:** [workflow.md](workflow.md) (the original design)
- **Status and next steps:** [roadmap.md](roadmap.md)
- **Deploying:** [docs/deployment.md](docs/deployment.md)

## How matching works

1. **Global Sky.** A Postgres table holds the position of the Sun, Moon,
   Mercury, Venus, Mars, Jupiter and Saturn every 15 minutes for 40 years
   (~1.4M rows), computed once with the Swiss Ephemeris.
2. **Golden Degrees (Phase 2).** From your natal chart we compute where a
   partner's planets would need to be to form each requested aspect with yours
   (e.g. _their Moon trine your Sun_). Every moment in the table where a
   partner could have been born — within ±10 years of you by default, and
   never anyone under 18 — is scored by how close it gets: a rule within the
   orb (±3° by default) earns half its credit, and the other half depends on
   how exact it is. The best moment of each day is kept, so results are
   distinct people rather than neighbouring 15-minute ticks of the same one.
3. **Local Refinement (Phase 3).** For the 30 best days we compute the
   partner's Placidus houses in each of Türkiye's 972 districts and keep the
   district where the house rules fit best (planet mid-house beats planet on
   a cusp). Ties go to the district nearest your own birthplace.
4. **Result.** Each match gets a fit score: 60% aspects, 40% houses. The top
   10 are returned, best first, with local birth time and per-rule detail.

Matches are **ranked, not filtered** — someone who meets every alignment
loosely can outrank someone who meets one exactly, and a search never comes
back empty just because no moment meets every rule at once. Scoring lives in
[apps/api/src/matching/scoring.ts](apps/api/src/matching/scoring.ts).

## Repository layout

| Path | What |
| --- | --- |
| [apps/api](apps/api) | NestJS API: auth, `/match`, `/districts`, `/health` |
| [apps/mobile](apps/mobile) | Expo (SDK 57) app, Turkish + English |
| [packages/api-types](packages/api-types) | Wire types and default rule sets shared by API and app |
| [packages/database](packages/database) | Prisma schema, migrations, seeders, district data |
| [packages/ephemeris](packages/ephemeris) | Typed wrapper around `sweph` (Swiss Ephemeris, Moshier mode) |

Yarn 1 workspaces + Turborepo.

## Local setup

Prerequisites: Node 22+, Yarn 1.22, Postgres 16, and a C/C++ toolchain for the
native `sweph` addon (on Windows, the "Desktop development with C++" build
tools).

```sh
yarn install

# Configure
cp apps/api/.env.example apps/api/.env            # set DATABASE_URL + JWT_SECRET
cp packages/database/.env.example packages/database/.env  # same DATABASE_URL, for the Prisma CLI
cp apps/mobile/.env.example apps/mobile/.env      # set EXPO_PUBLIC_API_URL

# Database
yarn db:deploy                                    # apply migrations
yarn workspace @synastry/database seed:districts  # 972 districts, seconds
yarn workspace @synastry/database seed            # 40-year sky, ~1.4M rows, several minutes
#   or `seed --years=1` for a quick demo window; re-running only fills gaps.
#   Matches can only be born inside the seeded range — see roadmap.md
#   "Before launch" for covering older users.

# Run
yarn workspace @synastry/api dev                  # API on :3000
yarn mobile                                       # Expo dev server
```

On a physical phone (Expo Go), `EXPO_PUBLIC_API_URL` must be your computer's
LAN address, e.g. `http://192.168.1.20:3000`.

Prefer containers? `docker compose up` runs Postgres and the API; see
[docs/deployment.md](docs/deployment.md).

## Tests

```sh
yarn test        # unit tests: scoring, SQL builder, refinement, timezones, seeder
yarn lint        # typechecks for every package + ESLint for the app

# End-to-end: boots the API against a throwaway Postgres schema and drives
# auth + matching over HTTP. The URL must use ?schema=e2e (or a *_test
# database) — the suite truncates it.
E2E_DATABASE_URL="postgresql://user:pass@localhost:5432/synastry?schema=e2e" yarn test:e2e
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all of the
above against Postgres 16 and also builds and boots the API Docker image.

## API at a glance

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | – | Email, password, birth date/time/district. Computes and stores the natal chart. |
| `POST` | `/auth/login` | – | Returns a 30-day JWT. |
| `GET` | `/auth/me` | JWT | Current user. |
| `PATCH` | `/auth/me` | JWT | Replace birth details; chart is recomputed. |
| `DELETE` | `/auth/me` | JWT | Delete the account (password required). |
| `POST` | `/match` | JWT | Optional `rules`, `orb`, `limit`, `houseRules`, `maxAgeGap`. Cached 24 h per user + settings. |
| `GET` | `/districts` | – | All districts, or `?q=` search. |
| `GET` | `/health` | – | 200 when the API and Postgres are up. |

Rate limits: 120 requests/min per IP overall; 10/min for login, signup and
account deletion; 20/min for `/match`.

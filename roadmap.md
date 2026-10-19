# Project Synastry — Roadmap

Tracks remaining work. Companion to [`workflow.md`](workflow.md), which is the
spec; this file is the punch list.

---

## Backend / matching engine

- ~~**Phase 3 — house calculation pipeline.**~~ ✅ Done. Implemented in
  [apps/api/src/refinement/](apps/api/src/refinement/), wired into
  [matching.service.ts](apps/api/src/matching/matching.service.ts), capped at
  100 candidates × 972 districts ≈ 1.6 s/request, cached 24 h.
- ~~**District dataset.**~~ ✅ Done. Full 972 districts sourced from
  [serkanozbeykurucu/CoordinateLookup](https://github.com/serkanozbeykurucu/CoordinateLookup),
  normalised into
  [packages/database/seed-data/turkey-districts.json](packages/database/seed-data/turkey-districts.json),
  loaded via the `District` Prisma model + `seed:districts` seeder, cached in
  memory by `RefinementService.onModuleInit`.
- **Restore strict default rules.** Currently the demo runs a relaxed 2-rule
  set at ±5° so a partial seed returns rows. Switch back to the workflow's
  full 4-rule set at ±3° once the full 40-year `GlobalSky` is seeded.
  ([matching.service.ts](apps/api/src/matching/matching.service.ts),
  [golden-degree.ts](apps/api/src/matching/golden-degree.ts))
- **Full 40-year seed.** Run `yarn workspace @synastry/database seed` to fill
  the full ~1.4M-row range.
- **Index tuning** (workflow §5). Profile the Phase 2 query under load and
  decide whether the existing composite index is enough.
- **Persistent cache.** The current 24h cache is in-memory `cache-manager`.
  Move to Redis once there's more than one API instance.
- **Auth + UserProfile persistence.** _NEXT._ Email/password signup that
  captures birth date + birth district once, then `/match` becomes
  authenticated and pre-fills from the user. JWT in AsyncStorage on the
  client, bcrypt + JWT on the server.
- **Rate limiting + request validation hardening** for any public deployment
  (`@nestjs/throttler`).

## Mobile

- ~~**City / location picker.**~~ ✅ Done. New `DistrictsService` +
  `GET /districts` endpoint backed by the seeded `District` table; mobile
  fetches once and filters client-side via the new `DistrictPicker`
  component. `RefinementService` now consumes `DistrictsService` so there's
  one source of truth.
- ~~**Birth time timezone awareness.**~~ ✅ Done server-side. New
  `TimezoneService` resolves the IANA TZ from the birth district's lat/lng
  via `tz-lookup` and converts the user's literal local time to UTC via
  Luxon. API contract changed from `birthTimestamp` to
  `birthLocalDate` + `birthLocalTime`. Mobile sends wall-clock strings; the
  bundle stays free of tz-data and Luxon.
- ~~**Form controls for orb / aspect set.**~~ ✅ Done. New `AdvancedControls`
  component with an orb stepper and a per-rule chip editor (planet glyphs +
  aspect short labels).
- ~~**Plain-language pass on results + form copy.**~~ ✅ Done. Sections
  reordered and reworded ("Your sky at birth", "Why this is your match",
  "What we're looking for", etc.); each section now has an explanatory
  subtitle. Advanced controls labelled "Fine-tune the matching" with the
  chip rows reading left-to-right as a sentence.
- ~~**Internationalisation (Turkish + English).**~~ ✅ Done. `lib/i18n`
  with React Context, `useT()` / `useLocale()` hooks, type-checked
  `Translations` interface, language toggle in the About tab. Default `tr`.
  `RefinementHit.satisfiedRules` was changed from server-formatted
  English strings to structured `HouseRule[]` so the mobile can render the
  "Why this is your match" sentences in either language. **Translation
  quality follow-up:** the current Turkish strings are a first-pass machine
  translation in places — needs a careful copy-edit pass with someone
  fluent (especially `t.advanced.rules.hint.tail`, the `houseRule`
  template, and the `metaPhase3` sentence).
- **Result detail screen.** Tap a candidate to see a fuller breakdown (full
  chart, which rules matched, Phase 3 city + houses).
- **Empty / error states polish.** "Find my match" failure shows raw API
  error text right now.
- **Persist last submitted form** in `AsyncStorage` so reloads don't wipe it.
- ~~**Theming.**~~ ✅ Done. Extended `constants/theme.ts` with a semantic
  palette + light/dark variants, added `useTheme()` hook, gave the form,
  results, and district picker themed cards, and added a gradient hero card
  for the Phase 3 headline via `expo-linear-gradient`.
- ~~**Replace second tab `explore.tsx`**~~ ✅ Done. Now an "About" screen
  explaining the Phase 1/2/3 pipeline, how to read the result, and linking
  to the data sources. Tab bar renamed Match / About with new icons.
- **Pin native datetimepicker** to the SDK 54-blessed version via
  `npx expo install @react-native-community/datetimepicker`.

## Cross-cutting / infrastructure

- ~~**Shared API types package.**~~ ✅ Done. New `@synastry/api-types`
  package owns every wire-format type. Both `@synastry/api` and the mobile
  app import from there; `@synastry/ephemeris` consumes `PlanetKey` /
  `PlanetaryChart` from it too. Wire timestamps are now uniformly
  ISO-8601 strings (Date→string conversion happens at the response
  boundary in `MatchingService` and `RefinementService`).
- ~~**NestJS DI without explicit `@Inject`.**~~ ✅ Done. API runner switched
  from `tsx` to `@swc-node/register` (with `nodemon` for dev watch). `.swcrc`
  emits TypeScript decorator metadata, so class-typed constructor params are
  resolved automatically. Six `@Inject(Class)` decorators dropped; `PRISMA`
  (Symbol token) and `CACHE_MANAGER` (string token) stay explicit.
- **Tests.** Partially done. ✅ 32 unit tests cover `golden-degree.ts`,
  `refinement.scorePair`, `TimezoneService` (incl. DST gap detection — which
  surfaced a real Luxon snap-forward bug fixed in the same change),
  `houseOf`, and `dateToJulianDayUT`. Wired into `turbo run test`. Still
  outstanding:
  1. `seed-global-sky.ts` resume logic (mocked Prisma).
  2. End-to-end `/match` against a tiny seeded fixture DB.
- **CI.** Wire `turbo run lint build` into a GitHub Actions workflow.
- **Dockerfile / docker-compose** for API + Postgres so deployment isn't
  ad-hoc.
- **`.env` audit.** `apps/api/.env` and `packages/database/.env` contain a
  real DB password — they're untracked but worth a `git status` check before
  any commit.

## Workflow §6 vision

- **Real user matching.** Switch the engine target from `GlobalSky` (anyone
  who _could_ have been born then) to `UserProfile` (people who actually
  exist). Same query shape, different table.
- **Notifications** when a new compatible profile is added.
- **LLM-generated synastry blurb** — feed the matched chart + satisfied rules
  into an LLM for a human-readable "why you click" story.

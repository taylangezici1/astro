# Project Synastry — Roadmap

What's left before launch, and what would make the product better. The spec is
[workflow.md](workflow.md); how things work today is in [README.md](README.md).

---

## Done (October 2026 takeover)

- **Engine ranks instead of filtering.** The workflow's 4-rule ±3° set
  returned nothing against the full sky, and the lenient demo set returned
  1000 ties with an alphabetical "best" district. Matches are now scored by
  how closely each rule is met, one per day, best district per candidate,
  combined into a fit score. Strict rules are the default again.
- **Plausible partners only:** born within ±10 years of the user
  (adjustable), never under 18.
- **Correctness fixes:** 13 border/island districts resolved to neighbouring
  countries' timezones (wrong birth instants); match cache ignored house
  rules; seeder skipped older years after a demo seed; Phase 2 always picked
  the earliest years; Phase 3 blocked the server ~1.6 s per request.
- **Account:** edit birth details, delete account (App Store requirement),
  no more placeholder birthday on signup.
- **Hardening:** rate limits, `/health`, timing-safe login, weak-secret
  guard, CORS/proxy config, graceful shutdown.
- **App:** results show distinct people with local birth time and a
  breakdown; localized, actionable errors; Turkish rule sentences rewritten
  with correct grammar; settings and language remembered.
- **Infra:** Dockerfile + compose, GitHub Actions CI (typecheck, lint, unit
  tests, migration drift, e2e against Postgres, Docker build + boot).
- **Index tuning:** dropped an unused 91 MB composite index, added
  per-planet indexes.

## Before launch

1. **Seed the sky for every adult age.** The table covers births from
   1986–2026, but only births at least 18 years ago are ever used, and users
   born before ~1976 get few or no matches. Fill 1940 → 1986 (the seeder only
   adds what's missing):
   `yarn workspace @synastry/database seed --start=1940-01-01 --end=1986-04-07`
   (~1.6M rows, a few minutes). Optionally delete rows newer than 18 years ago — they can
   never match.
2. **App identity.** Bundle ID / Android package, real icon and splash
   (still the Expo defaults), EAS build profiles, store listings, 18+ age
   rating.
3. **Privacy.** Birth date, time and place are personal data under KVKK
   (and GDPR for EU users): privacy policy, explicit consent at signup, a
   data-processing record. Deletion already exists.
4. **Password reset.** Without it, a forgotten password means a lost
   account. Needs an email provider.
5. **Native-speaker review of the Turkish copy.** I rewrote it with correct
   grammar, but a fluent copy editor should still read it — especially the
   astrology terms (e.g. "altmışlık" vs "sekstil").
6. **Look at it on a device.** This pass's UI changes were typechecked,
   linted and bundled, but not checked visually on a phone.
7. **Hosting:** one API instance + managed Postgres. Set `JWT_SECRET`,
   `TRUST_PROXY`, `CORS_ORIGINS` (see [docs/deployment.md](docs/deployment.md)).
   Add error monitoring (e.g. Sentry) to API and app.

## Product — recommended next

In rough order of value for effort:

1. **Explain the match in words.** The data behind each match (aspects,
   distances, house placements) is already structured; a short
   LLM-written "why you click" paragraph per match turns numbers into the
   part people actually share. Cache per match; a small model is enough.
2. **"I don't know my birth time."** Many people don't. Allow it: assume
   noon, skip house rules, and say the result is less precise. Biggest
   signup-funnel win.
3. **Shareable match card.** An image of the hero card for Instagram/
   WhatsApp — the app's growth loop.
4. **Less repetitive birthplaces.** House rules favour districts at the far
   east/west edges of Türkiye (Gökçeada and Iğdır come up a lot), because
   they give the widest range of house positions. Weighting by population, or
   preferring the user's region on near-ties, would feel more natural.
5. **Search the hour, not just the place.** Phase 3 varies the district but
   keeps each day's best 15-minute tick. Trying ±2 hours too would find
   much better house fits, at several times the Phase 3 cost (fine with caching).
6. **Smarter rule sets.** A fixed rule set can contradict itself for a given
   chart (e.g. it can ask for the partner's Moon both trine your Sun and in
   your 1st house). Ranking "best N of a larger library" of classic contacts
   would suit more charts.
7. **Users born outside Türkiye.** The user's own birthplace has to be a
   Turkish district today; a world city search would open the diaspora market.
8. **Real-user matching (workflow §6).** The big one: rank actual,
   opted-in users instead of hypothetical birth moments. Same scoring, a
   different table. Needs explicit consent, privacy controls and moderation
   — it turns the app from a curiosity into a social product.
9. **Notifications** when a strong real match signs up (after 8).

## Engineering

- **Expo SDK 58.** The app is on SDK 57, the version the App Store's Expo Go
  supports today. Expo Go for SDK 58 is due "within a few weeks" of 15 Oct
  2026; once your phone updates to it, run
  `npx expo install expo@^58.0.0 --fix` in apps/mobile. Better long-term:
  switch to an EAS development build so Expo Go updates stop mattering.

- **Redis** for the match cache and rate-limit counters once there's more
  than one API instance (both are in-memory today).
- **If Phase 2 gets hot:** load the sky into typed arrays in the API (~40 MB)
  and score in-process (~15 ms vs ~300 ms in Postgres).
- **Shorter-lived JWTs + refresh tokens** (tokens currently last 30 days and
  can't be revoked).
- **Existing users in the 13 affected districts** (dev data only so far) have
  a birth instant from the wrong timezone; re-saving their birth details
  fixes it.
- **CI upkeep:** the Docker GitHub Actions still target Node 20, and
  `ubuntu-latest` is moving to Ubuntu 26 — bump when convenient.

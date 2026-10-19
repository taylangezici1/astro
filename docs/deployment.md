# Deployment

The API ships as one Docker image (`apps/api/Dockerfile`) that runs alongside
Postgres 16. `docker-compose.yml` wires the two together for a single host.
CI (`.github/workflows/ci.yml`) typechecks, tests, and builds and smoke-tests
the image on every push and pull request.

## Local stack with Docker Compose

Requires Docker with BuildKit and Compose v2 (Docker Desktop, or Docker Engine
23+).

1. **Set a JWT secret.** Compose reads `./.env` automatically, and `.env` is
   gitignored. Compose refuses to start without it.

   ```sh
   echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
   ```

2. **Build and start** Postgres and the API:

   ```sh
   docker compose up --build -d
   docker compose logs -f api     # wait for "API listening on http://0.0.0.0:3000"
   ```

   On every start the API container runs `prisma migrate deploy` before it
   boots, so the schema is always current. The API is at
   <http://localhost:3000>.

3. **Seed reference data** (see [Seeding](#seeding)):

   ```sh
   docker compose --profile seed run --rm seed                       # full sky (slow)
   SEED_ARGS=--years=1 docker compose --profile seed run --rm seed   # quick demo data
   ```

   The API loads the district list into memory at boot. If it was already
   running when you seeded districts for the first time, run
   `docker compose restart api`.

Useful extras:

- `docker compose exec db psql -U synastry -d synastry` opens a SQL shell.
  Postgres is not published to the host by default, because a local dev
  Postgres usually already owns port 5432. Uncomment the `ports` block in
  `docker-compose.yml` to expose it on `127.0.0.1:5433`.
- `docker compose down` stops the stack. `docker compose down -v` also deletes
  the `pgdata` volume, which wipes the database.

### Without Compose

```sh
docker build -f apps/api/Dockerfile -t synastry-api .     # context = repo root
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/synastry?schema=public" \
  -e JWT_SECRET="..." \
  synastry-api
```

## Environment variables

| Variable          | Required | Default        | Notes |
| ----------------- | -------- | -------------- | ----- |
| `DATABASE_URL`    | yes      | none           | Postgres connection string, read by Prisma (the API, migrations and the seeders). |
| `JWT_SECRET`      | yes      | none           | Signs auth tokens. The API refuses to boot without it. Generate a long random value (`openssl rand -hex 32`) and keep it stable: rotating it logs every user out. |
| `PORT`            | no       | `3000`         | HTTP port. The API binds `0.0.0.0`. |
| `NODE_ENV`        | no       | `production`   | Set by the image. |
| `SKIP_MIGRATIONS` | no       | unset          | Container only. `1` skips the `prisma migrate deploy` that runs on start. |
| `SEED_ARGS`       | no       | empty          | Compose `seed` service only. Extra arguments for the sky seeder. |

Outside Docker, the API also loads `apps/api/.env` and then
`packages/database/.env` if they exist (see `apps/api/.env.example`). Inside the
image there are none: `.dockerignore` keeps every `.env` file out of the build,
so configure the container through real environment variables.

## Seeding

The `seed` service runs two seeders in order. The image entrypoint applies
migrations first, so it works on an empty database. Both seeders are idempotent
(`createMany` + `skipDuplicates`), so re-running them is safe.

| Data | Command (inside the image / a dev checkout) | Size | Duration |
| ---- | ------------------------------------------- | ---- | -------- |
| Türkiye districts | `yarn workspace @synastry/database seed:districts` | 972 rows | Seconds. |
| Sky, full window (default) | `yarn workspace @synastry/database seed` | ~1.4M rows (40 years of 15-minute ticks) | **Long.** Every tick is computed with Swiss Ephemeris and batch-inserted into an indexed table. Budget tens of minutes or more, depending on CPU and disk. The seeder prints throughput and an ETA every 2,000 ticks. |
| Sky, demo (`SEED_ARGS=--years=1`) | `... seed --years=1` (also `yarn workspace @synastry/database seed:small`) | ~35k rows (last 12 months) | About 1/40 of the full run. |
| Sky, custom window | `... seed --start=2000-01-01 --end=2001-01-01` | ~35k rows per year | Proportional to the window. |

Matching only considers candidate birth moments inside the seeded sky window,
so with demo data every candidate is from the last 12 months.

The sky seeder resumes from the **latest** timestamp already stored in the
requested window. If you seed the 1-year demo first and later run the full
40-year seed, it only fills in ticks newer than the demo data. To get the full
history, either truncate first:

```sh
docker compose exec db psql -U synastry -d synastry -c 'TRUNCATE "GlobalSky"'
```

or seed the older range explicitly with
`SEED_ARGS="--start=<40 years ago> --end=<first day of the demo window>"`
(dates as `YYYY-MM-DD`, UTC).

## Image notes

- **Base:** `node:22-bookworm-slim` (Debian/glibc, Node 22 LTS), multi-stage.
  `sweph` is a native node-gyp addon (Swiss Ephemeris C sources), so the
  builder stage installs `python3 make g++` to compile it. Both stages install
  `openssl` for Prisma's engines.
- **No compile step.** The API runs from TypeScript source via
  `@swc-node/register`, the seeders use `tsx`, and migrations use the Prisma
  CLI. These are devDependencies, so the image keeps the full dependency tree.
  `apps/mobile` is excluded from the build context entirely.
- **Startup:** `tini`, then `apps/api/docker-entrypoint.sh`, which runs
  `prisma migrate deploy` and then `node -r @swc-node/register src/main.ts` as
  the unprivileged `node` user. Arguments passed to the container replace the
  server command (migrations still run first), e.g.
  `docker run --rm -e DATABASE_URL=... synastry-api yarn workspace @synastry/database seed:districts`.
- **Healthcheck:** Node's built-in `fetch` against `GET /health`. A 5xx or no
  response counts as unhealthy; a 404 is tolerated until the `/health` route
  exists.

## Scaling: single instance for now

- **The 24h match cache is in-memory.** It is `@nestjs/cache-manager` with the
  default store, per process. Running more than one API replica gives each its
  own cold cache, with no sharing or coordinated invalidation, and memory use
  multiplies. Run **one** API instance until the cache moves to Redis (planned,
  see `roadmap.md`). Restarting the container also clears the cache.
- **Migrations on boot** suit a single instance. `prisma migrate deploy` holds
  a Postgres advisory lock, so concurrent starts are safe, but for
  multi-instance or zero-downtime deploys run it once as a release step and
  start the app containers with `SKIP_MIGRATIONS=1`. For the release step, use
  `docker run --rm -e DATABASE_URL=... synastry-api true` (the entrypoint
  migrates, then exits) or `yarn db:deploy` from a checkout.

## CI

`.github/workflows/ci.yml` runs on every push and pull request:

- **`check`** (Node 22, Postgres 16 service): runs
  `yarn install --frozen-lockfile`, then `yarn db:generate`, then
  `yarn db:deploy` against a fresh database. It then checks with
  `prisma migrate diff --exit-code` that `schema.prisma` matches the migrations,
  runs `yarn turbo run lint test` (all workspace typechecks, `expo lint`, and
  the vitest suites), and finally typechecks the mobile app with
  `npx tsc --noEmit -p apps/mobile`. `DATABASE_URL` and a CI-only `JWT_SECRET`
  are exported for future e2e tests.
- **`docker`**: builds `apps/api/Dockerfile` with Buildx and the GitHub Actions
  layer cache, without pushing. It then runs the image against a Postgres 16
  service: migrations, both seeders over a one-day sky window, and API boot,
  and asserts that `GET /districts` returns data.

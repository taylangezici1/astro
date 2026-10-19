# syntax=docker/dockerfile:1
#
# Production image for @synastry/api (NestJS).
#
# The build context MUST be the repository root, because the API consumes the
# workspace packages (database, ephemeris, api-types) as TypeScript sources:
#
#   docker build -f apps/api/Dockerfile -t synastry-api .
#   # or: docker compose build api
#
# There is no compile step. The API runs its TS sources through
# @swc-node/register at startup, the Prisma CLI applies migrations, and the
# seeders run via tsx. All three are devDependencies, so the image deliberately
# ships the full, unpruned dependency tree. Do not add `--production`.
#
# Requires BuildKit (default in Docker Engine 23+ / Docker Desktop / Compose v2)
# for the RUN --mount cache below.

ARG NODE_VERSION=22

# -----------------------------------------------------------------------------
# builder: install deps (compiles the native `sweph` addon), generate Prisma
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS builder

# python3, make, g++  node-gyp toolchain. `sweph` compiles the Swiss Ephemeris
#                     C sources at install time; there are no prebuilt binaries.
# openssl             lets Prisma detect the platform (debian-openssl-3.0.x)
#                     so the matching query/schema engines are downloaded.
# ca-certificates     HTTPS for the Prisma engine and node-gyp header downloads.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1

WORKDIR /app

# 1) Manifests only, so the expensive install layer is cached until a
#    package.json or yarn.lock changes.
#
#    apps/mobile is excluded by .dockerignore, so yarn's `apps/*` workspace
#    glob only sees apps/api. `--frozen-lockfile` still passes: yarn 1 fails it
#    only when a requested dependency pattern is MISSING from yarn.lock. The
#    now-unused Expo/React Native entries are simply ignored and the lockfile
#    is not rewritten. (Checked with yarn 1.22.22 against this repo's
#    yarn.lock, mobile absent: exit 0, lockfile byte-identical.)
#    If a future yarn ever rejects that, fall back to `--pure-lockfile`. It
#    still won't write the lockfile, but it stops failing on a stale one. The
#    CI `check` job runs a full `--frozen-lockfile` install anyway.
COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/
COPY packages/api-types/package.json packages/api-types/
COPY packages/database/package.json packages/database/
COPY packages/ephemeris/package.json packages/ephemeris/

RUN --mount=type=cache,target=/yarn-cache,sharing=locked \
    YARN_CACHE_FOLDER=/yarn-cache \
    yarn install --frozen-lockfile --non-interactive --network-timeout 600000

# 2) Prisma client. Only depends on the schema. The generator has no custom
#    output, so the client lands in /app/node_modules/.prisma/client.
COPY packages/database/prisma packages/database/prisma
RUN yarn workspace @synastry/database generate

# 3) Sources. COPY merges into the existing dirs, so the per-workspace
#    node_modules created by the install above are kept.
COPY packages/api-types packages/api-types
COPY packages/ephemeris packages/ephemeris
COPY packages/database packages/database
COPY apps/api apps/api

# Windows checkouts (core.autocrlf=true) give the script CRLF line endings and
# no exec bit. Normalise both so the image works whichever OS built it.
RUN sed -i 's/\r$//' apps/api/docker-entrypoint.sh \
 && chmod 0755 apps/api/docker-entrypoint.sh

# -----------------------------------------------------------------------------
# runtime
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

# openssl  Prisma's engines link against libssl3, and Prisma probes for it to
#          choose the engine. Without it, Prisma falls back to openssl-1.1.x
#          and fails.
# tini     PID 1: forwards SIGTERM/SIGINT so `docker stop` is prompt, and
#          reaps zombies.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl tini \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3000 \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1

WORKDIR /app

# Files stay root-owned, so the unprivileged `node` user can read and execute
# them but not modify them. Workspace symlinks in node_modules/@synastry and
# node_modules/.bin are preserved, and they stay valid because /app is the
# same path in both stages. Contents:
#   node_modules                  incl. compiled sweph .node, generated Prisma
#                                 client, Prisma engines, swc, tsx
#   packages/database/prisma      schema + migrations for `migrate deploy`
#   packages/database/seed-data   districts JSON for the seed profile
#   packages/database/scripts     seeders
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Fail the image build, not the first request, if the native addon or the
# Prisma engines can't load on this base image. `prisma version` loads the
# query-engine library and runs the schema-engine binary.
RUN node -e "require('sweph'); console.log('sweph native addon: OK')" \
 && node_modules/.bin/prisma version

USER node

EXPOSE 3000

# Liveness: the process answers HTTP on /health. A 5xx (e.g. the planned
# /health reporting the DB as down) or no answer counts as unhealthy. A 404 is
# tolerated so the image stays healthy until the /health route exists.
# No curl/wget in slim images, so use Node's built-in fetch.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', { signal: AbortSignal.timeout(4000) }).then((r) => process.exit(r.status < 500 ? 0 : 1), () => process.exit(1))"]

# The entrypoint applies pending migrations (set SKIP_MIGRATIONS=1 to opt out),
# then starts the API. Any arguments replace the server command, e.g.:
#   docker run --rm -e DATABASE_URL=... synastry-api yarn workspace @synastry/database seed:districts
ENTRYPOINT ["/usr/bin/tini", "--", "/app/apps/api/docker-entrypoint.sh"]

#!/bin/sh
# Container entrypoint for @synastry/api (see apps/api/Dockerfile).
#
#   1. Applies pending Prisma migrations. `prisma migrate deploy` is
#      idempotent and takes a Postgres advisory lock, so containers starting at
#      the same time (e.g. `api` + `seed`) are safe. Set SKIP_MIGRATIONS=1 when
#      migrations run as a separate release step (multi-instance deploys).
#   2. With no arguments, starts the API. Otherwise it exec's the arguments,
#      e.g. a seeder.
set -eu

cd /app

if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  echo "[entrypoint] applying database migrations (prisma migrate deploy)"
  yarn --silent workspace @synastry/database migrate:deploy
fi

if [ "$#" -eq 0 ]; then
  # Same command as `yarn workspace @synastry/api start`, but exec'd directly
  # so node (not yarn) receives signals from tini. Must run from apps/api:
  # @swc-node/register reads ./tsconfig.json from the cwd, and that file
  # enables experimentalDecorators + emitDecoratorMetadata, which NestJS DI
  # needs.
  cd /app/apps/api
  echo "[entrypoint] starting API on port ${PORT:-3000}"
  exec node -r @swc-node/register src/main.ts
fi

exec "$@"

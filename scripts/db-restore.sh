#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/db-restore.sh supabase/backups/backup-YYYYMMDD-HHMMSS.sql
# Requires Docker or local psql. Reads DATABASE_URL from .env

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IN_FILE=${1:-}
if [ -z "$IN_FILE" ] || [ ! -f "$IN_FILE" ]; then
  echo "[err] Provide a valid .sql file. Example: ./scripts/db-restore.sh supabase/backups/backup-20251030-120000.sql" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "[err] .env not found. Create it with DATABASE_URL first." >&2
  exit 1
fi

set -a
source .env
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[err] DATABASE_URL not set in .env" >&2
  exit 1
fi

if command -v docker >/dev/null 2>&1; then
  echo "[info] Using Dockerized psql (postgres:16)"
  docker run --rm \
    -e PGPASSWORD="$(echo "$DATABASE_URL" | sed -E 's#postgresql://([^:]+):([^@]+)@.*#\2#')" \
    -v "$PWD":"/workspace" \
    --network host \
    postgres:16-alpine \
    bash -lc "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f /workspace/$IN_FILE"
else
  if ! command -v psql >/dev/null 2>&1; then
    echo "[err] Neither Docker nor psql are available. Install one of them to proceed." >&2
    exit 2
  fi
  echo "[info] Using local psql"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$IN_FILE"
fi

echo "[ok] Restore completed from $IN_FILE"

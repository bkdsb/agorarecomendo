#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/db-backup.sh
# Requires: Docker (recommended) or local pg_dump. Reads DATABASE_URL from .env

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="supabase/backups"
OUT_FILE="$OUT_DIR/backup-$STAMP.sql"

mkdir -p "$OUT_DIR"

if [ ! -f .env ]; then
  echo "[err] .env not found. Create it with DATABASE_URL first." >&2
  exit 1
fi

# Load DATABASE_URL without echoing it
set -a
source .env
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[err] DATABASE_URL not set in .env" >&2
  exit 1
fi

# Prefer Dockerized pg_dump to avoid local installs
if command -v docker >/dev/null 2>&1; then
  echo "[info] Using Dockerized pg_dump (postgres:16)"
  docker run --rm \
    -e PGPASSWORD="$(echo "$DATABASE_URL" | sed -E 's#postgresql://([^:]+):([^@]+)@.*#\2#')" \
    -v "$PWD":"/workspace" \
    --network host \
    postgres:16-alpine \
    bash -lc "pg_dump --no-owner --no-privileges --format=p \"$DATABASE_URL\" > /workspace/$OUT_FILE"
else
  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "[err] Neither Docker nor pg_dump are available. Install one of them to proceed." >&2
    exit 2
  fi
  echo "[info] Using local pg_dump"
  pg_dump --no-owner --no-privileges --format=p "$DATABASE_URL" > "$OUT_FILE"
fi

# Minimal redact notice
SIZE=$(wc -c < "$OUT_FILE" | xargs)
echo "[ok] Backup written: $OUT_FILE ($SIZE bytes)"

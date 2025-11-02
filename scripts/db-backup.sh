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
# If granular DB_* envs are provided, prefer them (avoids URL issues with special chars)
if [ -n "${DB_HOST:-}" ] && [ -n "${DB_NAME:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ]; then
  DB_PASS="$DB_PASSWORD"
  DB_PORT="${DB_PORT:-5432}"
else
  # Robust parsing for DATABASE_URL with special chars in password (supports unencoded '@')
  RAW_URL="$DATABASE_URL"
  RAW_NO_SCHEME="${RAW_URL#*://}"
  DB_USER="${RAW_NO_SCHEME%%:*}"
  PASS_AND_HOST="${RAW_NO_SCHEME#*:}"
  # Password is everything before the LAST '@'
  DB_PASS="${PASS_AND_HOST%*@*}"
  # Host/Port/DB is everything after the LAST '@'
  HOSTPORTDB="${PASS_AND_HOST##*@}"
  HOSTPORT="${HOSTPORTDB%%/*}"
  DB_NAME="${HOSTPORTDB#*/}"
  DB_HOST="${HOSTPORT%%:*}"
  DB_PORT_TMP="${HOSTPORT#*:}"
  if [ "$DB_PORT_TMP" = "$HOSTPORT" ]; then DB_PORT="5432"; else DB_PORT="$DB_PORT_TMP"; fi
fi

# Prefer local pg_dump if available, fall back to Docker if not
if command -v pg_dump >/dev/null 2>&1; then
  echo "[info] Using local pg_dump"
  export PGPASSWORD="$DB_PASS"
  export PGSSLMODE="require"
  echo "[info] Dumping $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME -> $OUT_FILE"
  if ! pg_dump --no-owner --no-privileges -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$OUT_FILE"; then
    echo "[err] pg_dump failed. Please verify DB credentials (user/password/host/port/db) or try DB_* env variables to avoid URL encoding issues." >&2
    rm -f "$OUT_FILE" 2>/dev/null || true
    exit 3
  fi
  # ensure file is non-empty
  if [ ! -s "$OUT_FILE" ]; then
    echo "[err] Backup file is empty. Aborting." >&2
    rm -f "$OUT_FILE" 2>/dev/null || true
    exit 4
  fi
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "[err] Neither pg_dump nor Docker are available. Install one of them to proceed." >&2
    exit 2
  fi
  echo "[info] Using Dockerized pg_dump (postgres:16)"
  docker run --rm \
    -e PGPASSWORD="$DB_PASS" \
    -e PGSSLMODE="require" \
    -v "$PWD":"/workspace" \
    --network host \
    postgres:16-alpine \
  bash -lc "echo '[info] Dumping $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME -> /workspace/$OUT_FILE'; pg_dump --no-owner --no-privileges -h '$DB_HOST' -p '$DB_PORT' -U '$DB_USER' -d '$DB_NAME' > /workspace/$OUT_FILE && [ -s /workspace/$OUT_FILE ] || { echo '[err] Empty backup file'; rm -f /workspace/$OUT_FILE; exit 4; }"
fi

# Minimal redact notice
SIZE=$(wc -c < "$OUT_FILE" | xargs)
echo "[ok] Backup written: $OUT_FILE ($SIZE bytes)"

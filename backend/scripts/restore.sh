#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: restore.sh <backup-file>" >&2
  exit 1
fi

: "${DATABASE_URL:?DATABASE_URL must be set}"

gunzip -c "$1" | psql "$DATABASE_URL"

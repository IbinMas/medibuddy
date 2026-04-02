#!/bin/sh
set -e

echo "Running database migrations…"
./node_modules/.bin/prisma migrate deploy --schema backend/prisma/schema.prisma

echo "Starting MediBuddy backend…"
exec node dist/main.js

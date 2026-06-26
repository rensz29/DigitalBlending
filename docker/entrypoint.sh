#!/bin/sh
set -e

DATA_DIR=/app/server/data
SEED_DIR=/app/server/data-seed

if [ ! -f "$DATA_DIR/recipes.json" ]; then
  echo "Seeding data directory from image defaults..."
  mkdir -p "$DATA_DIR"
  cp -r "$SEED_DIR/." "$DATA_DIR/"
fi

exec "$@"

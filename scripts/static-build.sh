#!/bin/bash
# Build a static export of just the moodboard gallery page.
# API routes are temporarily moved out since they're server-only.

set -e

API_DIR="src/app/api"
BACKUP_DIR=".api-backup"

echo "Preparing static export..."

# Move API routes out temporarily
mv "$API_DIR" "$BACKUP_DIR"

# Also move dev-only pages
mkdir -p .pages-backup
for page in browse ignored furniture playground; do
  if [ -d "src/app/$page" ]; then
    mv "src/app/$page" ".pages-backup/$page"
  fi
done

# Build with static export
STATIC_EXPORT=1 npx next build

# Restore API routes and pages
mv "$BACKUP_DIR" "$API_DIR"
for page in browse ignored furniture playground; do
  if [ -d ".pages-backup/$page" ]; then
    mv ".pages-backup/$page" "src/app/$page"
  fi
done
rmdir .pages-backup 2>/dev/null || true

echo "Static site generated in 'out/' directory"

#!/usr/bin/env bash
# ============================================================
# PumpRadio v2 — Deploy Script
# ============================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${APP_DIR}/.env.production"

echo "▸ PumpRadio v2 Deploy"
echo "▸ Directory: ${APP_DIR}"
echo "▸ $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ── 1. Load env ───────────────────────────────────────────
if [ -f "$ENV_FILE" ]; then
  echo "✓ Loading .env.production"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "⚠ No .env.production found. Using defaults."
fi

# ── 2. Prune old images ────────────────────────────────────
echo "▸ Pruning old Docker images..."
docker image prune -f --filter "until=7d" 2>/dev/null || true

# ── 3. Database migrations ────────────────────────────────
echo "▸ Running database migrations..."
docker compose run --rm app npx prisma migrate deploy 2>/dev/null || {
  echo "⚠ Migration failed, trying db push..."
  docker compose run --rm app npx prisma db push --accept-data-loss 2>/dev/null || true
}

# ── 4. Build & deploy ─────────────────────────────────────
echo "▸ Building and deploying..."
TAG="$(date '+%Y%m%d-%H%M%S')" docker compose up -d --build --remove-orphans

# ── 5. Health check ────────────────────────────────────────
echo "▸ Waiting for app to be healthy..."
for i in {1..30}; do
  sleep 2
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "✓ App is healthy! (attempt $i)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "✗ App failed health check after 60s"
    docker compose logs app --tail 50
    exit 1
  fi
  echo "  Waiting... (attempt $i, status: $STATUS)"
done

# ── 6. Summary ──────────────────────────────────────────────
echo ""
echo "✓ Deploy complete!"
echo "  App:  http://localhost:3000"
echo "  Health: http://localhost:3000/api/health"
echo ""
docker compose ps

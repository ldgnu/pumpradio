# ============================================================
# PumpRadio v2 — Multi-stage Docker Build
# ============================================================

# ── Stage 1: Dependencies ───────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts

# ── Stage 2: Builder ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
COPY --from=deps /app/node_modules ./node_modules

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Stage 3: Runner (production minimal image) ──────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache tini curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

USER nextjs
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

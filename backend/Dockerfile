# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json tsconfig.build.json ./
RUN npm ci

COPY backend/ ./backend/

RUN npm run prisma:generate && npm run build

# ── Stage 2: Production runner ───────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nestjs -u 1001

# Copy the full node_modules (includes Prisma CLI + generated query-engine binary)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist          ./dist
COPY backend/prisma                    ./backend/prisma
COPY backend/docker-entrypoint.sh      ./docker-entrypoint.sh

RUN mkdir -p logs \
 && chmod +x docker-entrypoint.sh \
 && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]

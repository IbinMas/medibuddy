# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY web/package*.json ./
RUN npm ci

COPY web/ ./
RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner
ENV VITE_BACKEND_URL="https://medibuddy-api.elicitlabs.link"
COPY --from=builder /app/dist        /usr/share/nginx/html
COPY web/nginx.conf                  /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

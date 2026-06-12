# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    chromium \
    curl ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Install cursor-agent CLI — keep full version bundle (node + index.js), not just the wrapper script
RUN curl -fsSL https://cursor.com/install | bash \
    && VER="$(ls /root/.local/share/cursor-agent/versions | head -1)" \
    && mkdir -p /opt/cursor-agent \
    && cp -a "/root/.local/share/cursor-agent/versions/${VER}" /opt/cursor-agent/current \
    && ln -sf /opt/cursor-agent/current/cursor-agent /usr/local/bin/cursor-agent \
    && chmod -R a+rX /opt/cursor-agent

# Python deps for geo skill scripts
COPY geo-skill/requirements.txt /tmp/geo-requirements.txt
RUN python3 -m venv /app/geo-skill/.venv \
    && /app/geo-skill/.venv/bin/pip install --no-cache-dir -r /tmp/geo-requirements.txt

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SITE_URL=https://geo-report.fusionsync.ai
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/data
ENV GEO_SKILL_PATH=/app/geo-skill
ENV CHROME_BIN=/usr/bin/chromium
ENV HOME=/data/home
ENV XDG_CONFIG_HOME=/data/home/.config
ENV XDG_CACHE_HOME=/data/home/.cache
ENV XDG_DATA_HOME=/data/home/.local/share

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && mkdir -p /data/home/.cursor/projects /data/home/.config /data/home/.cache /data/home/.local/share \
    && chown -R nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/geo-skill ./geo-skill
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/content ./content

USER root
RUN python3 -m venv /app/geo-skill/.venv \
    && /app/geo-skill/.venv/bin/pip install --no-cache-dir -r /app/geo-skill/requirements.txt \
    && chown -R nextjs:nodejs /app/geo-skill/.venv

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

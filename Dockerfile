# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY next.config.js tailwind.config.ts postcss.config.js tsconfig.json ./
COPY src/ src/
COPY public/ public/
RUN npm run build

# --- Stage 2: Build server ---
FROM node:20-bookworm AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src/ src/
RUN npx tsc

# --- Stage 3: Production image ---
FROM node:20-bookworm-slim

# mediasoup needs these at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Frontend
COPY --from=frontend-build /app/.next .next/
COPY --from=frontend-build /app/public public/
COPY --from=frontend-build /app/node_modules node_modules/
COPY package.json next.config.js ./

# Server
COPY --from=server-build /app/server/dist server/dist/
COPY --from=server-build /app/server/node_modules server/node_modules/
COPY server/package.json server/

# Default environment
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_PUBLIC_SERVER_URL=http://localhost:3001

EXPOSE 3000 3001 40000-49999/udp

# Start both processes
CMD ["sh", "-c", "node server/dist/index.js & npx next start -p 3000"]

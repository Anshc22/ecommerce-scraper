FROM node:18-bullseye-slim AS builder

# Install build dependencies (Chromium libs may also be needed at runtime)
RUN apt-get update && apt-get install -y \
  ca-certificates fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libx11-xcb1 \
  libxcomposite1 libxdamage1 libxrandr2 libxss1 libglib2.0-0 libcups2 libasound2 libgbm1 wget --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/frontend

# Install dependencies and build
COPY frontend/package*.json ./
COPY frontend/package-lock.json ./
RUN npm ci

# Copy source and build the app (includes API under frontend/app/api)
COPY frontend/ ./
RUN npm run build

FROM node:18-bullseye-slim AS runner

# Install runtime dependencies for Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
  ca-certificates fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libx11-xcb1 \
  libxcomposite1 libxdamage1 libxrandr2 libxss1 libglib2.0-0 libcups2 libasound2 libgbm1 wget --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/frontend

# Copy built artifacts and production dependencies from builder
COPY --from=builder /usr/src/app/frontend/.next ./.next
COPY --from=builder /usr/src/app/frontend/public ./public
COPY --from=builder /usr/src/app/frontend/node_modules ./node_modules
COPY --from=builder /usr/src/app/frontend/package*.json ./

ENV PORT=3000
EXPOSE 3000

# At container start, ensure a production build exists (fallback to building at runtime)
CMD ["sh","-lc","echo '*** .next contents:'; if [ -d ./.next ]; then ls -la ./.next; else echo '.next missing'; fi; npx next start -p $PORT"]

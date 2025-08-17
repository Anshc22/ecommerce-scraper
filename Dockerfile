FROM node:18-bullseye-slim

# Install Puppeteer/Chromium dependencies
RUN apt-get update && apt-get install -y \
  ca-certificates fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libx11-xcb1 \
  libxcomposite1 libxdamage1 libxrandr2 libxss1 libglib2.0-0 libcups2 libasound2 libgbm1 wget --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Build the Next app (if using Next.js)
RUN npm run build || true

ENV PORT=3000
EXPOSE 3000

CMD ["npx","next","start","-p","3000"]

FROM oven/bun:1

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 3001

ENV PORT=3001
CMD ["bun", "src/index.ts"]

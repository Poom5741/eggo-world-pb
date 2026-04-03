FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .

RUN bun build src/index.ts --outdir dist --target bun

EXPOSE 3001

ENV PORT=3001
CMD ["bun", "dist/index.js"]

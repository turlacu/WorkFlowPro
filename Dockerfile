FROM node:22.23.1-alpine3.24 AS dependencies
WORKDIR /app
# Prisma's native engines need a detectable OpenSSL runtime. Keep these
# packages in the shared base so migrations, bootstrap, and builds all use
# the same compatible runtime libraries.
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
WORKDIR /app
ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
COPY . .
RUN npx prisma generate
RUN npm run build

FROM dependencies AS migrator
WORKDIR /app
ENV NODE_ENV=production
COPY prisma ./prisma
ENTRYPOINT ["./node_modules/.bin/prisma"]
CMD ["migrate", "deploy"]

FROM dependencies AS bootstrap
WORKDIR /app
ENV NODE_ENV=production
COPY prisma ./prisma
RUN npx prisma generate
ENTRYPOINT ["./node_modules/.bin/tsx"]
CMD ["prisma/seed.ts"]

FROM node:22.23.1-alpine3.24 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]

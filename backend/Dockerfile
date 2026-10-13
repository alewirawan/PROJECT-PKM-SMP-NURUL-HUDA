FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace=@nurul-huda/backend --include-workspace-root

COPY backend backend
RUN npm run build --workspace=@nurul-huda/backend && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 --ingroup app app
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=app:app /app/backend/dist ./backend/dist
COPY --from=builder --chown=app:app /app/backend/package.json ./backend/package.json

USER app
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]

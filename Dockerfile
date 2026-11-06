FROM node:24.15.0-bookworm-slim AS build
ARG SOURCE_REVISION
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV CMS_BUILD_TARGET=server ASTRO_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:24.15.0-bookworm-slim
ARG SOURCE_REVISION
LABEL org.opencontainers.image.source="https://github.com/theharithsa/theharithsanotes" org.opencontainers.image.revision=$SOURCE_REVISION
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 CMS_BUILD_TARGET=server CMS_DATA_SOURCE=firestore
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/runtime ./runtime
COPY --from=build --chown=node:node /app/jobs ./jobs
COPY --from=build --chown=node:node /app/src/server ./src/server
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
CMD ["node","--import","./runtime/instrumentation.mts","dist/server/entry.mjs"]

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY . .
# Build from the monorepo root, NOT apps/api as the Docker context.
RUN if [ -f package-lock.json ]; then npm ci --include=optional; else npm install --include=optional; fi
RUN npm run build:packages && npm run build --workspace @flavorpilot/api
RUN npm prune --omit=dev
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages ./packages
COPY --from=build --chown=node:node /app/apps/api ./apps/api
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]

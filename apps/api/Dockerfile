FROM node:22-alpine AS build
WORKDIR /app

COPY package.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/flavor-engine/package.json packages/flavor-engine/package.json
RUN npm install

COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages/contracts packages/contracts
COPY packages/flavor-engine packages/flavor-engine
RUN npm run build:packages && npm run build --workspace @flavorpilot/api && npm prune --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/packages/flavor-engine/package.json ./packages/flavor-engine/package.json
COPY --from=build /app/packages/flavor-engine/dist ./packages/flavor-engine/dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||process.env.API_PORT||4000;fetch('http://127.0.0.1:'+p+'/v1/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/main.js"]

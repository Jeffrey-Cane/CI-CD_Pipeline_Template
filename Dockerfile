# syntax=docker/dockerfile:1

# ---- Stage 1: install production dependencies -----------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- Stage 2: slim runtime image ------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    APP_PORT=8080
WORKDIR /app

# Run as an unprivileged user (the node image ships a "node" user).
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node app ./app

USER node
EXPOSE 8080

# Lightweight container healthcheck hitting the app's /health endpoint.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.APP_PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "app/index.js"]

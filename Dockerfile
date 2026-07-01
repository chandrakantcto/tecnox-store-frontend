FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# --- Build-time public config ---
# NEXT_PUBLIC_* variables are INLINED into the client bundle at build time, so they
# must be present during `npm run build` (runtime env alone is not enough for the browser).
# Override per deployment: docker build --build-arg NEXT_PUBLIC_VENDURE_SHOP_API_URL=... .
# (On CapRover, set these as build args in the app's deployment config.)
ARG NEXT_PUBLIC_VENDURE_SHOP_API_URL="https://gastro-backend.cap.aibestwriter.com/shop-api"
ARG NEXT_PUBLIC_SITE_URL="https://tecnox-store-frontend.cap.aibestwriter.com"
ARG VENDURE_SHOP_API_URL="https://gastro-backend.cap.aibestwriter.com/shop-api"
ENV NEXT_PUBLIC_VENDURE_SHOP_API_URL=$NEXT_PUBLIC_VENDURE_SHOP_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    VENDURE_SHOP_API_URL=$VENDURE_SHOP_API_URL

RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production

# Runtime config is provided by the deployment platform (CapRover app env vars):
#   NEXT_PUBLIC_VENDURE_SHOP_API_URL  (also needed at runtime for server reads)
#   VENDURE_SHOP_API_URL              (internal Docker URL preferred, e.g. http://srv-captain--gastro-backend:3000/shop-api)
#   VENDURE_CHANNEL_TOKEN             (must match the active channel token in the backend)
#   NEXT_PUBLIC_SITE_URL

EXPOSE 3000

CMD ["npm", "start"]

# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# (opcjonalnie) w Alpine argon2 bywa prekompilowany; jeśli nie, dodaj apk add build-base python3 i zbuduj w "build"
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 4001
ENV NODE_OPTIONS=--enable-source-maps
CMD ["node", "dist/main.js"]

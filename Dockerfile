# Build the static bundle, then serve it with nginx. No runtime Node.
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# The unprivileged image runs as uid 101 and listens on 8080; nothing here needs root.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

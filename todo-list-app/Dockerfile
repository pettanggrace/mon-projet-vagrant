
# syntax=docker/dockerfile:1

# ---- Étape 1 : installation des dépendances (avec outils de compilation) ----
FROM node:22-alpine AS deps
# python3/make/g++ : au cas où sqlite3 doit être compilé (module natif)
RUN apk add --no-cache python3 make g++
WORKDIR /app
# On copie d'abord UNIQUEMENT les manifestes : cette couche reste en cache
# tant que les dépendances ne changent pas (builds CI beaucoup plus rapides)
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean

# ---- Étape 2 : image finale, légère ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    SQLITE_DB_LOCATION=/etc/todos/todo.db

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Dossier de la base SQLite, appartenant à l'utilisateur non-root "node"
RUN mkdir -p /etc/todos && chown -R node:node /etc/todos
USER node

EXPOSE 3000

# Docker vérifie toutes les 30 s que l'app répond
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/items >/dev/null || exit 1

CMD ["node", "src/index.js"]

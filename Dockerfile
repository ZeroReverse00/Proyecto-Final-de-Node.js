FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app

# Dependencias primero para aprovechar la caché de capas
# (si generas package-lock.json con `npm install`, puedes cambiar a `npm ci --omit=dev`)
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .
RUN mkdir -p public/uploads && chown -R node:node /app
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "app.js"]

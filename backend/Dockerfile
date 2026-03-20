FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN mkdir -p uploads

# Script to wait for database and apply migrations/schema
RUN printf '#!/bin/sh\nset -e\necho "Waiting for database..."\nuntil npx prisma db execute --stdin --schema=./prisma/schema.prisma <<SQL >/dev/null 2>&1\nSELECT 1;\nSQL\ndo\n  echo "Database not ready, retrying in 3s..."\n  sleep 3\ndone\necho "Database is ready. Applying migrations..."\nif npx prisma migrate deploy; then\n  echo "Migrations applied successfully."\nelse\n  echo "prisma migrate deploy failed, falling back to prisma db push for compatibility."\n  npx prisma db push --skip-generate\nfi\nexec npm start\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]

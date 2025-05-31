# === Stage 1: Builder ===
FROM node:20-alpine AS builder

# 1) Переходим в рабочую директорию
WORKDIR /app

# 2) Копируем package-файлы и устанавливаем ВСЕ зависимости (dev + prod)
COPY package*.json ./
RUN npm ci

# 3) Копируем весь исходный код и собираем приложение
COPY . .
RUN npm run build

# 4) Создаём необходимые папки для runtime (uploads, reports, backups, tmp)
RUN mkdir -p uploads reports backups tmp

# === Stage 2: Production ===
FROM node:20-alpine

# 5) Переходим в /app
WORKDIR /app

# 6) Копируем package-файлы из builder и устанавливаем только production-зависимости
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

# 7) Копируем уже собранную папку dist и папку server из build-этапа
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# 8) Копируем каталоги, созданные в builder (чтобы volume-маппинг сразу работал)
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/reports ./reports
COPY --from=builder /app/backups ./backups
COPY --from=builder /app/tmp ./tmp

# 9) Устанавливаем системную утилиту для psql (если нужно подключаться к БД через CLI)
RUN apk add --no-cache postgresql-client

# 10) Делаем периферию: создаём непривилегированного пользователя (для безопасности)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    chown -R nextjs:nodejs /app

# 11) Переключаемся на непользователь root
USER nextjs

# 12) Открываем порт 5000
EXPOSE 5000

# 13) HEALTHCHECK (проверяет, отвечает ли ваш API на /api/health)
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# 14) Запускаем ваше приложение
CMD ["npm", "start"]

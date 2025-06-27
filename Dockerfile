# Dockerfile для Railway (опционально)
FROM node:18-alpine

# Установка зависимостей для canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Изменение владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Открытие порта
EXPOSE 3000

# Команда запуска
CMD ["npm", "start"]

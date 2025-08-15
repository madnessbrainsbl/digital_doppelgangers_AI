# Используем Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем весь проект
COPY . .

# Копируем .env файл если он существует
RUN if [ -f .env ]; then cp .env .env; fi

# Открываем порты
EXPOSE 3000
EXPOSE 5174

# Команда для запуска в dev режиме (можно заменить на production)
CMD ["pnpm", "dev"]

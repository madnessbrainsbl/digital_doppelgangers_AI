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
RUN if [ -f .env ]; then cp .env .env; else if [ -f .env.example ]; then cp .env.example .env; fi; fi

# Открываем порт
EXPOSE 5173

# Команда для запуска в dev режиме
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

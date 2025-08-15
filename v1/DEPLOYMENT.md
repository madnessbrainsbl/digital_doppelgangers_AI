# Инструкции по развертыванию Digital Twin MVP на сервере

## Рекомендуемый проект для деплоя

**Digital Twin MVP** (основная папка) - лучший выбор для деплоя по следующим причинам:

✅ **Преимущества:**
- Уже использует Gemini API (OpenAI заменен)
- Полностью функциональный и протестированный
- Уникальная Telegram User API интеграция
- Специализирован на создании персональных AI двойников
- Продвинутый анализ данных из Telegram JSON
- Готов к работе "из коробки"

⚠️ **Проект v2** требует доработки:
- Архитектурно сложнее
- Использует много зависимостей (bcrypt проблемы)
- Частично замена OpenAI на Gemini не завершена
- Больше подходит для бизнес-ассистентов

## Шаги развертывания

### 1. Подготовка сервера

```bash
# Установка Docker и Docker Compose на Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# Запуск Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Клонирование проекта

```bash
# Скопируйте проект на сервер
scp -r "D:\15.08.2025" user@your-server:/home/user/digital-twin-mvp

# Или используйте git если проект в репозитории
git clone your-repository-url digital-twin-mvp
cd digital-twin-mvp
```

### 3. Конфигурация переменных окружения

```bash
# Создайте production .env файл
cp .env.production .env

# Отредактируйте API ключи
nano .env
```

**Обязательные переменные для изменения:**
```env
# ВАЖНО: Замените на свой Gemini API ключ
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Опционально: замените на свои ключи
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 4. Сборка и запуск

```bash
# Сборка Docker образа
docker-compose build

# Запуск в фоновом режиме
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 5. Проверка работы

```bash
# Проверка логов
docker-compose logs -f digital-twin-app

# Проверка доступности
curl http://localhost:5173

# Проверка health check
docker-compose exec digital-twin-app curl http://localhost:5173
```

### 6. Настройка обратного прокси (опционально)

```nginx
# /etc/nginx/sites-available/digital-twin
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация конфига Nginx
sudo ln -s /etc/nginx/sites-available/digital-twin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Текущее состояние проекта

### ✅ Что работает:
1. **Frontend** - React приложение на Vite
2. **База данных** - Supabase PostgreSQL настроена
3. **AI сервис** - Gemini API интегрирован
4. **Telegram User API** - через внешний Python сервер
5. **Анализ данных** - парсинг JSON файлов Telegram
6. **Создание двойников** - персональные AI модели
7. **Голосовые возможности** - ElevenLabs TTS

### ⚠️ Что может потребовать настройки:
1. **Python Telegram API сервер** - проверить доступность http://85.202.193.46:8000
2. **API ключи** - убедиться что все ключи актуальны
3. **CORS настройки** - если фронтенд и бэкенд на разных доменах

## Мониторинг и обслуживание

```bash
# Просмотр логов
docker-compose logs -f

# Перезапуск сервиса
docker-compose restart

# Обновление после изменений
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Резервное копирование
docker-compose exec digital-twin-app tar -czf /tmp/backup.tar.gz /app
docker cp container_id:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

## Безопасность

1. **Файрвол:**
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

2. **SSL сертификат (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. **Регулярные обновления:**
```bash
# Настройте автоматические обновления системы
sudo apt install unattended-upgrades
```

## Поддержка

При возникновении проблем проверьте:

1. **Логи контейнера:** `docker-compose logs digital-twin-app`
2. **Состояние сервисов:** `docker-compose ps`
3. **Доступность портов:** `netstat -tlnp | grep 5173`
4. **API ключи:** убедитесь что Gemini API ключ валиден
5. **Внешние сервисы:** проверьте доступность Supabase и Telegram API сервера

## Масштабирование

Для высоких нагрузок можно:

1. Использовать несколько реплик контейнера
2. Настроить load balancer
3. Оптимизировать базу данных
4. Кэшировать статические файлы

```yaml
# docker-compose.yml для масштабирования
services:
  digital-twin-app:
    # ... existing config
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

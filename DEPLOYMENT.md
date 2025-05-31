
# Развертывание на Yandex Cloud

## Подготовка

1. Создайте виртуальную машину в Yandex Cloud с Docker
2. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-username/Summa.git
cd Summa
```

## Настройка переменных окружения

Создайте файл `.env`:
```bash
cp .env.example .env
```

Заполните переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `SESSION_SECRET` - секретный ключ для сессий
- `POSTGRES_PASSWORD` - пароль для PostgreSQL

## Запуск

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## Проверка

Приложение будет доступно на порту 5000.
Health check: `http://your-server:5000/api/health`

## Обновление

```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

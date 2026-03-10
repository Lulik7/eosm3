# 🐳 Запуск Service Desk Backend с Docker

## 🚀 Быстрый старт

### 1. Запуск всех сервисов
```bash
docker-compose up -d
```

### 2. Проверка работы
```bash
# Проверка статуса контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f backend
```

### 3. Остановка
```bash
docker-compose down
```

## 📋 Что включено

- **MongoDB 6.0** - база данных с авторизацией
- **Backend API** - Node.js приложение
- **Сеть** - изолированная сеть для контейнеров
- **Тома** - постоянное хранение данных MongoDB

## 🔧 Конфигурация

### MongoDB
- **Порт**: 27017
- **Пользователь**: admin / password123
- **База данных**: service-desk
- **Данные**: сохраняются в volume `mongodb_data`

### Backend
- **Порт**: 3000
- **Окружение**: production
- **Зависимости**: MongoDB контейнер

## 🌐 Доступ

- **API**: http://localhost:3000/api
- **MongoDB**: mongodb://admin:password123@localhost:27017
- **Health Check**: http://localhost:3000/api/health

## 📝 Переменные окружения

В `docker-compose.yml` можно изменить:

```yaml
environment:
  MONGODB_URI: mongodb://admin:password123@mongodb:27017/service-desk?authSource=admin
  SESSION_SECRET: your-super-secret-session-key-change-this-in-production-docker
  FRONTEND_URL: http://localhost:3000
```

## 🔧 Разработка с Docker

### Режим разработки
```bash
# Запуск с монтированием исходного кода
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Пересборка образа
```bash
# Если изменили зависимости
docker-compose build --no-cache backend

# Если изменили исходный код
docker-compose build backend
```

## 🐛 Отладка

### Просмотр логов
```bash
# Все логи
docker-compose logs

# Только backend
docker-compose logs backend

# Только MongoDB
docker-compose logs mongodb

# В реальном времени
docker-compose logs -f backend
```

### Вход в контейнер
```bash
# В backend контейнер
docker-compose exec backend sh

# В MongoDB контейнер
docker-compose exec mongodb mongosh
```

### Перезапуск сервисов
```bash
# Перезапустить только backend
docker-compose restart backend

# Перезапустить все
docker-compose restart
```

## 📊 Мониторинг

### Статус контейнеров
```bash
docker-compose ps
```

### Использование ресурсов
```bash
docker stats
```

## 🔒 Безопасность в продакшене

1. **Измените пароли** в docker-compose.yml
2. **Используйте .env файл** для секретов
3. **Ограничьте доступ** к MongoDB порту
4. **Используйте HTTPS** с reverse proxy

### Пример с .env файлом

Создайте `.env` файл:
```env
MONGO_ROOT_PASSWORD=your-secure-password
SESSION_SECRET=your-super-secret-key-256-bits-long
FRONTEND_URL=https://your-domain.com
```

Измените docker-compose.yml:
```yaml
environment:
  MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
  SESSION_SECRET: ${SESSION_SECRET}
  FRONTEND_URL: ${FRONTEND_URL}
```

## 🔄 Обновление

### Обновление образов
```bash
docker-compose pull
docker-compose up -d
```

### Полная переустановка
```bash
docker-compose down -v
docker-compose up -d --build
```

## 📦 Резервное копирование

### Экспорт данных MongoDB
```bash
docker-compose exec mongodb mongodump --out /backup
docker cp $(docker-compose ps -q mongodb):/backup ./backup
```

### Импорт данных
```bash
docker cp ./backup $(docker-compose ps -q mongodb):/backup
docker-compose exec mongodb mongorestore /backup
```

## 🚀 Продакшен развертывание

### С docker-compose.prod.yml
```yaml
version: '3.8'
services:
  backend:
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://user:pass@mongodb:27017/service-desk?authSource=admin
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

Запуск:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📞 Поддержка

При проблемах:
1. Проверьте логи: `docker-compose logs`
2. Проверьте порты: `docker ps`
3. Проверьте сеть: `docker network ls`

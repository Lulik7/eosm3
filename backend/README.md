# 🏙️ City Control Service Desk

A robust, enterprise-grade incident management and technical support system built with a focus on security, scalability, and role-based access control (RBAC).

---

## 🚩 Project Status: Stage 1 Completed (Skeleton & Security)

The first phase of development is successfully finalized. Below is the technical report for Stage 1.

### ✅ Backend Achievements
- **Architecture**: Established the server skeleton using the **Router-Controller-Service** pattern.
- **Authentication**: `/login` and `/register` endpoints are fully operational.
- **JWT Strategy**: Implemented Access and Refresh token rotation delivered via `httpOnly` cookies.
- **Token Invalidation**: Integrated **Redis** for a blacklist to store invalidated `jti` (JWT IDs).
- **Security Logic**: Roles are correctly encoded in and retrieved from JWT payloads.
- **Health Checks**: Public `/health` endpoints are available for all services without authentication.
- **Audit**: All `401 Unauthorized` and `403 Forbidden` attempts are logged.

### ✅ Frontend Achievements
- **Auth Integration**: Login/Logout functionality is fully connected to the backend API.
- **RBAC Navigation**: Implemented dynamic routing; users see only permitted pages based on their roles.
- **Session Management**: Logout effectively clears session data and cookies.
- **Auto-Logout**: Application automatically redirects to the login page if the refresh token expires (401).
- **UI/UX**: Initial design skeleton and localized Support/Login pages are completed.

---

## 🏗️ System Architecture



### 🔒 Security & Authentication Flow
1. **User Login**: `POST /api/auth/login` verifies credentials using `bcrypt` and checks the `isActive` status.
2. **Token Delivery**: Server issues an `accessToken` (short-lived) and a `refreshToken` (long-lived) via **httpOnly, Secure, SameSite: Strict** cookies.
3. **Automatic Auth**: The browser includes cookies automatically in every cross-origin request (with credentials).
4. **Token Rotation**: `POST /api/auth/refresh` uses the `jti`. Upon success:
    - The old `jti` is added to the **Redis blacklist** until its original expiration.
    - A new pair of tokens is issued to the client.

### 🛡️ Middleware System
- **authenticate()**: Validates the `accessToken` cookie. Returns `401` if missing or expired.
- **requireAdmin()**: Restricts access to users with the `admin` role.
- **requireSupport()**: Grants access to `admin` and `support` roles.

---

## 📊 Data Models

### User Model (`User.ts`)
- **Fields**: `username`, `email`, `password` (hashed), `role`, `isActive`, `lastLogin`.
- **Key Methods**: `comparePassword`, `toSafeObject` (strips sensitive data).

### Request Model (`Request.ts`)
- **Fields**: `title`, `description`, `category`, `priority`, `status`, `createdBy`, `assignedTo`.
- **Features**:
    - `statusHistory`: Array of objects tracking every status change (who, when, why).
    - `comments`: Supports internal (private) and public messages.

### Incident Model (`Incident.ts`)
- **Auto-Generation**: Automatic ID sequencing (e.g., `INC-000001`).
- **Fields**: `severity`, `status`, `type`, `affectedServices`, `rootCause`, `impactCost`.
- **Features**: Public updates and private technical response team logs.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js**: v16 or higher
- **MongoDB**: Local instance or Atlas
- **Redis**: Required for token blacklisting

### 2. Environment Variables (.env)
Create a `.env` file in the backend root:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=development


-----------------------------------------------------------------
# 🏙️ City Control Service Desk

Надежная система управления инцидентами и технической поддержкой корпоративного уровня, разработанная с упором на безопасность, масштабируемость и ролевую модель управления доступом (RBAC).

---

## 🚩 Статус проекта: Этап 1 завершен (Каркас и Безопасность)

Первый этап разработки успешно завершен. Ниже представлен технический отчет по Итерации 1.

### ✅ Достижения в Backend
- **Архитектура**: Построен каркас сервера с использованием паттерна **Router-Controller-Service**.
- **Аутентификация**: Эндпоинты `/login` (вход) и `/register` (регистрация) полностью функциональны.
- **Стратегия JWT**: Реализована ротация Access и Refresh токенов, передаваемых через безопасные `httpOnly` куки.
- **Инвалидация токенов**: Интегрирован **Redis** для ведения черного списка (blacklist) отозванных `jti` (JWT ID).
- **Логика безопасности**: Роли пользователей корректно кодируются в JWT и считываются сервером.
- **Проверка состояния**: Публичные эндпоинты `/health` доступны для всех сервисов без авторизации.
- **Аудит**: Все попытки несанкционированного доступа (`401` и `403`) логируются.

### ✅ Достижения в Frontend
- **Интеграция Auth**: Функционал входа и выхода полностью связан с API бэкенда.
- **Навигация RBAC**: Реализован динамический роутинг; пользователи видят только те страницы, которые разрешены их ролью.
- **Управление сессией**: Выход из системы (Logout) эффективно очищает данные сессии и куки.
- **Авто-выход**: Приложение автоматически перенаправляет на страницу логина, если срок действия Refresh-токена истек (401).
- **UI/UX**: Готов каркас дизайна, страницы поддержки и логина локализованы.

---

## 🏗️ Архитектура системы



### 🔒 Поток аутентификации и безопасности
1. **Вход пользователя**: `POST /api/auth/login` проверяет учетные данные (bcrypt) и статус `isActive`.
2. **Передача токенов**: Сервер выдает `accessToken` (краткосрочный) и `refreshToken` (долгосрочный) через куки с флагами **httpOnly, Secure, SameSite: Strict**.
3. **Авто-авторизация**: Браузер автоматически прикрепляет куки к каждому запросу.
4. **Ротация токенов**: `POST /api/auth/refresh` использует идентификатор `jti`. При успехе:
    - Старый `jti` заносится в **черный список Redis** до истечения его срока жизни.
    - Клиенту выдается новая пара токенов.

### 🛡️ Система Middleware
- **authenticate()**: Проверяет `accessToken` в куках. Возвращает `401`, если токен отсутствует или просрочен.
- **requireAdmin()**: Ограничивает доступ только для администраторов.
- **requireSupport()**: Разрешает доступ ролям `admin` и `support`.

---

## 📊 Модели данных

### Модель User (Пользователь)
- **Поля**: `username`, `email`, `password` (хеш), `role`, `isActive`, `lastLogin`.
- **Методы**: `comparePassword`, `toSafeObject` (удаляет чувствительные данные перед отправкой).

### Модель Request (Заявка)
- **Поля**: `title`, `description`, `category`, `priority`, `status`, `createdBy`, `assignedTo`.
- **Особенности**: 
    - `statusHistory`: Массив объектов, фиксирующий каждое изменение статуса (кто, когда, причина).
    - `comments`: Поддержка внутренних (приватных) и публичных сообщений.

### Модель Incident (Инцидент)
- **Авто-генерация**: Автоматическое создание номеров (например, `INC-000001`).
- **Поля**: `severity`, `status`, `type`, `affectedServices`, `rootCause`, `impactCost`.
- **Особенности**: Публичные обновления статуса и логи технической группы реагирования.

---

## ⚙️ Установка и запуск

### 1. Требования
- **Node.js**: v16 или выше
- **MongoDB**: Локальная база или Atlas
- **Redis**: Необходим для работы черного списка токенов

### 2. Переменные окружения (.env)
Создайте файл `.env` в корне бэкенда:
```env
PORT=3git add .000
MONGODB_URI=ваш_адрес_подключения_mongodb
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=ваш_секрет_access
JWT_REFRESH_SECRET=ваш_секрет_refresh
NODE_ENV=development
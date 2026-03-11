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

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (React/Vue)   │◄──►│   (Express.js)  │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                        │                        │
       │                        │                        │
    Browser                  Redis (blacklist)          Documents
    Cookies                 (refresh token jti)        (JSON/BSON)
```

### 🔑 Role-Based Access & Invite Codes

At registration, staff enter an invite code in the **"Staff Access"** field to receive their role.  
Without a code → registered as a regular `user`.

| Role | Invite Code | Home Page | Permissions |
|------|-------------|-----------|-------------|
| `user` | *(no code)* | `/user` | Submit tickets, view own requests |
| `support` | `SUPPORT2026` | `/support` | Kanban board, manage tickets & incidents, message Admin |
| `engineer` | `ENGINEER2026` | `/engineer` | View all incidents, update status, add work notes, message Support & Admin |
| `admin` | `ADMIN2026` | `/admin` | Full access, navigate to all pages, message Support & Engineer |

> **Admin** can navigate directly to `/support` and `/engineer` from the Admin dashboard.

### Password Requirements
- Minimum **6 characters**
- At least one **uppercase** letter (A–Z)
- At least one **lowercase** letter (a–z)
- At least one **digit** (0–9)

✅ Example: `Password1`

---

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
- **requireEngineer()**: Grants access to `admin` and `engineer` roles.

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

### Message Model (`Message.ts`) — New
- **Fields**: `from` (sender role), `fromUsername`, `to` (target role), `text`, `read`, `createdAt`.
- **Collection**: `messages` — auto-created in MongoDB on first send, no manual setup required.
- **Scope**: Role-addressed — each role sees only messages sent to their role.

---

## 💬 Internal Messaging System

Staff roles (Admin, Support, Engineer) can send and receive messages through a built-in inbox.

### Messaging Matrix

| Sender | Can send to |
|--------|-------------|
| Admin | Support, Engineer |
| Engineer | Support, Admin |
| Support | Admin |

### How it works
- Messages are stored in MongoDB (`messages` collection)
- Unread badge updates every **30 seconds** via polling
- Opening the inbox marks all messages as read automatically
- Each role page has an **Inbox** button with an unread counter:
   - **Admin** — inbox button in the header toolbar + send form in the messenger panel
   - **Support** — inbox button in header (desktop) / drawer (mobile) + reply field inside inbox dialog
   - **Engineer** — inbox button between Admin and EXIT buttons (desktop) / drawer (mobile)

### New backend files
```
backend/src/models/Message.ts
backend/src/controllers/messageController.ts
backend/src/routes/messages.ts
```

### API Endpoints
```
POST   /api/messages               Send a message to a role
GET    /api/messages/inbox         Get messages for the current user's role
GET    /api/messages/unread        Get unread message count
PATCH  /api/messages/:id/read      Mark a message as read
```

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
```

---
---
---

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

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (React/Vue)   │◄──►│   (Express.js)  │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                        │                        │
       │                        │                        │
    Browser                  Redis (blacklist)          Documents
    Cookies                 (refresh token jti)        (JSON/BSON)
```

### 🔑 Ролевой доступ и коды приглашений

При регистрации сотрудники вводят код в поле **"Staff Access / Введите код"** для получения своей роли.  
Без кода → регистрация как обычный `user`.

| Роль | Код приглашения | Страница | Права доступа |
|------|-----------------|----------|---------------|
| `user` | *(без кода)* | `/user` | Создание тикетов, просмотр своих обращений |
| `support` | `SUPPORT2026` | `/support` | Kanban-доска, управление тикетами и инцидентами, отправка сообщений Admin |
| `engineer` | `ENGINEER2026` | `/engineer` | Просмотр всех инцидентов, смена статуса, журнал работ, сообщения Support и Admin |
| `admin` | `ADMIN2026` | `/admin` | Полный доступ, переход на все страницы, сообщения Support и Engineer |

> **Администратор** может перейти на страницы `/support` и `/engineer` прямо из своей панели.

### Требования к паролю
- Минимум **6 символов**
- Хотя бы одна **ЗАГЛАВНАЯ** буква
- Хотя бы одна **строчная** буква
- Хотя бы одна **цифра**

✅ Пример: `Password1`

---

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
- **requireEngineer()**: Разрешает доступ ролям `admin` и `engineer`.

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

### Модель Message (Сообщение) — Новая
- **Поля**: `from` (роль отправителя), `fromUsername`, `to` (целевая роль), `text`, `read`, `createdAt`.
- **Коллекция**: `messages` — создаётся в MongoDB автоматически при первой отправке, ручная настройка не нужна.
- **Область видимости**: Адресация по роли — каждая роль видит только сообщения, отправленные на её роль.

---

## 💬 Система внутренних сообщений

Роли сотрудников (Admin, Support, Engineer) могут отправлять и получать сообщения через встроенный inbox.

### Матрица сообщений

| Отправитель | Может написать |
|-------------|---------------|
| Admin | Support, Engineer |
| Engineer | Support, Admin |
| Support | Admin |

### Как это работает
- Сообщения хранятся в MongoDB (коллекция `messages`)
- Счётчик непрочитанных обновляется каждые **30 секунд** через polling
- При открытии inbox все сообщения автоматически помечаются как прочитанные
- На каждой странице роли есть кнопка **Inbox** со счётчиком непрочитанных:
   - **Admin** — кнопка inbox в верхней панели + форма отправки в панели мессенджера
   - **Support** — кнопка inbox в хедере (десктоп) / drawer (мобайл) + поле ответа внутри диалога inbox
   - **Engineer** — кнопка inbox между кнопками Admin и EXIT (десктоп) / drawer (мобайл)

### Новые файлы бэкенда
```
backend/src/models/Message.ts
backend/src/controllers/messageController.ts
backend/src/routes/messages.ts
```

### API эндпоинты
```
POST   /api/messages               Отправить сообщение роли
GET    /api/messages/inbox         Получить сообщения для текущей роли
GET    /api/messages/unread        Получить количество непрочитанных
PATCH  /api/messages/:id/read      Пометить сообщение как прочитанное
```

---

## ⚙️ Установка и запуск

### 1. Требования
- **Node.js**: v16 или выше
- **MongoDB**: Локальная база или Atlas
- **Redis**: Необходим для работы черного списка токенов

### 2. Переменные окружения (.env)
Создайте файл `.env` в корне бэкенда:
```env
PORT=3000
MONGODB_URI=ваш_адрес_подключения_mongodb
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=ваш_секрет_access
JWT_REFRESH_SECRET=ваш_секрет_refresh
NODE_ENV=development
```

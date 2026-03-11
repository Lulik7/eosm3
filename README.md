# City Control — Smart City Service Desk

A full-stack incident and ticket management system for city infrastructure.  
Built with React + TypeScript (frontend) and Node.js + Express + MongoDB (backend), deployed via Docker.

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC)**: Four distinct roles — User, Support, Engineer, Admin
- **Advanced Security**: JWT authentication via `httpOnly` cookies, token rotation, Redis-based blacklist
- **Ticket System**: Kanban board with drag-and-drop, status tracking, incident creation from tickets
- **Incident Management**: Automated incident number generation, severity levels, status history, work log
- **Engineer Terminal**: Full incident view, status updates, notes/remarks journal
- **Admin Dashboard**: System overview, incident log, cross-page navigation
- **Internal Messaging**: Real-time inbox system between Admin, Support, and Engineer roles

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, MUI (Material UI), Vite |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB + Mongoose ODM |
| Cache / Security | Redis (JWT refresh token blacklist) |
| Auth | JWT (Access + Refresh token rotation) |
| Validation | Express-validator |
| Deploy | Docker Compose |

---

## ⚙️ Installation & Setup

### Prerequisites
- Docker Desktop
- Node.js v18+

### 1. Clone the repository
```bash
git clone https://github.com/Lulik7/eosm3.git
cd eosm3-main
```

### 2. Start the backend (MongoDB + Redis + API)
```bash
docker-compose up -d
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

## 🔑 User Roles & Invite Codes

At registration, enter the invite code in the **"Staff Access"** field to receive the corresponding role.  
Without a code → registered as a regular `user`.

| Role | Invite Code | Home Page | Access |
|------|-------------|-----------|--------|
| `user` | *(no code)* | `/user` | Submit tickets, view own requests |
| `support` | `SUPPORT2026` | `/support` | Kanban board, manage incidents |
| `engineer` | `ENGINEER2026` | `/engineer` | View incidents, update status, add work notes |
| `admin` | `ADMIN2026` | `/admin` | Full access, navigate to all pages |

> **Admin** can navigate to `/support` and `/engineer` pages directly from the Admin dashboard.

### Password Requirements
- Minimum **6 characters**
- At least one **uppercase** letter (A–Z)
- At least one **lowercase** letter (a–z)
- At least one **digit** (0–9)

✅ Example: `Password1`

---

## 🏗 Project Structure

```
eosm3-main/
├── backend/
│   └── src/
│       ├── controllers/       # Business logic (auth, tickets, incidents, messages)
│       ├── models/            # Mongoose models (User, Ticket, Incident, Message)
│       ├── routes/            # Express routes
│       ├── middleware/        # Authentication, role guards
│       ├── validators/        # Request validation schemas
│       └── utils/             # Helpers, JWT utils, query builders
├── frontend/
│   └── src/
│       ├── pages/             # loginPage, supportsPage, engineersPage, adminsPage, usersPage
│       ├── services/          # ticketService, incidentService (API calls)
│       ├── types/             # TypeScript interfaces
│       └── api/               # Axios instance with credentials
└── docker-compose.yml
```

---

## 🔐 Authentication Flow

1. **Register / Login** → Server issues Access Token + Refresh Token via `httpOnly` cookies
2. **Access Token** expires in 15 minutes
3. **Refresh Token** expires in 7 days; on rotation, old JTI is blacklisted in Redis
4. **Security**: `SameSite: Strict` (CSRF protection) + `HttpOnly` (XSS protection)

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register       Register new user
POST /api/auth/login          Login
POST /api/auth/logout         Logout
POST /api/auth/refresh        Refresh tokens
GET  /api/auth/me             Get current user
GET  /api/auth/users          List all users (admin)
```

### Tickets
```
GET    /api/tickets                Get tickets (own for user, all for support/admin)
POST   /api/tickets                Create ticket
PATCH  /api/tickets/:id/status     Update ticket status
DELETE /api/tickets/:id            Delete ticket
```

### Incidents
```
GET    /api/incidents              Get all incidents
GET    /api/incidents/:id          Get incident by ID
POST   /api/incidents              Create incident (support)
PATCH  /api/incidents/:id/status   Update status (support + engineer)
POST   /api/incidents/:id/updates  Add work note (support + engineer)
PUT    /api/incidents/:id          Full update (support)
DELETE /api/incidents/:id          Delete (admin only)
```

### Messages
```
POST   /api/messages               Send a message to a role (admin, support, or engineer)
GET    /api/messages/inbox         Get all messages addressed to the current user's role
GET    /api/messages/unread        Get unread message count for the current user's role
PATCH  /api/messages/:id/read      Mark a message as read
```

> All message endpoints require authentication. Messages are role-addressed — each role sees only messages sent `to` their role.

---

## 💬 Internal Messaging System

Staff roles (Admin, Support, Engineer) can send and receive messages through a built-in inbox.

### How it works

- Messages are stored in MongoDB in the `messages` collection (auto-created on first send)
- Each message has: `from` (sender role), `fromUsername`, `to` (target role), `text`, `read`, `createdAt`
- The inbox badge updates every **30 seconds** via polling
- Opening the inbox marks all messages as read automatically

### Who can message whom

| Sender | Can send to |
|--------|-------------|
| Admin | Support, Engineer |
| Engineer | Support, Admin |
| Support | Admin |

### New backend files to add

Copy these files into the project before rebuilding Docker:

```
backend/src/models/Message.ts              ← Mongoose model
backend/src/controllers/messageController.ts  ← send, inbox, markRead, unreadCount
backend/src/routes/messages.ts             ← route definitions
```

Also replace `backend/src/app.ts` — it now imports and registers the messages route:
```typescript
import messageRoutes from './routes/messages';
app.use('/api/messages', messageRoutes);
```

### Rebuild after adding files

```powershell
docker-compose build backend
docker-compose up -d
```

> MongoDB will automatically create the `messages` collection on the first message sent — no manual setup required.

### Frontend inbox (all 3 role pages)

Each role page has an **Inbox** button with an unread badge:
- **Admin** — inbox button in the header toolbar + send form in the messenger panel
- **Support** — inbox button in header (desktop) / drawer (mobile) + reply field inside the inbox dialog
- **Engineer** — inbox button between Admin and EXIT buttons (desktop) / drawer (mobile)

---

## 🗄 Database — Manual Role Change

If needed, change a user's role directly in MongoDB:

```bash
docker exec -it service-desk-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

use service-desk
db.users.updateOne({ email: "user@example.com" }, { $set: { role: "support" } })
```

---

## 🐳 Docker Services

| Container | Description | Port |
|-----------|-------------|------|
| `service-desk-backend` | Node.js API | 3000 |
| `service-desk-mongodb` | MongoDB database | 27017 |
| `service-desk-redis` | Redis cache | 6379 |

---

## 📋 Status Reference

### Ticket Statuses
`new` → `investigating` → `monitoring` → `resolved` → `closed`

### Incident Statuses
`new` → `investigating` → `identified` → `monitoring` → `resolved` → `closed`

### Incident Severities
`low` · `medium` · `high` · `critical`

---
---
---

# City Control — Городской Сервис-Деск (на русском)

Полнофункциональная система управления инцидентами и тикетами городской инфраструктуры.  
Frontend: React + TypeScript + MUI. Backend: Node.js + Express + MongoDB. Деплой: Docker.

---

## 🚀 Основные возможности

- **Ролевой доступ (RBAC)**: четыре роли — Пользователь, Саппорт, Инженер, Администратор
- **Безопасность**: JWT через `httpOnly` куки, ротация токенов, Redis-блэклист
- **Система тикетов**: Kanban-доска с drag-and-drop, создание инцидентов из тикетов
- **Управление инцидентами**: автогенерация номеров, приоритеты, история статусов, журнал работ
- **Терминал инженера**: полный просмотр инцидентов, смена статуса, добавление замечаний
- **Панель администратора**: обзор системы, лог инцидентов, переход на все страницы
- **Внутренние сообщения**: система входящих сообщений между ролями Admin, Support и Engineer

---

## 🛠 Технологии

| Уровень | Технология |
|---------|-----------|
| Frontend | React 18, TypeScript, MUI (Material UI), Vite |
| Backend | Node.js, Express.js, TypeScript |
| База данных | MongoDB + Mongoose |
| Кеш / Безопасность | Redis (JWT блэклист) |
| Аутентификация | JWT (Access + Refresh токены) |
| Валидация | Express-validator |
| Деплой | Docker Compose |

---

## ⚙️ Установка и запуск

### Требования
- Docker Desktop
- Node.js v18+

### 1. Клонировать репозиторий
```bash
git clone https://github.com/Lulik7/eosm3.git
cd eosm3-main
```

### 2. Запустить бэкенд (MongoDB + Redis + API)
```bash
docker-compose up -d
```

### 3. Запустить фронтенд
```bash
cd frontend
npm install
npm run dev
```

| Сервис | Адрес |
|--------|-------|
| Фронтенд | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

## 🔑 Роли и коды доступа

При регистрации введите код в поле **"Staff Access / Введите код"** для получения нужной роли.  
Без кода → регистрация как обычный `user`.

| Роль | Код | Страница | Доступ |
|------|-----|----------|--------|
| `user` | *(без кода)* | `/user` | Создание тикетов, просмотр своих обращений |
| `support` | `SUPPORT2026` | `/support` | Kanban-доска, управление инцидентами |
| `engineer` | `ENGINEER2026` | `/engineer` | Просмотр инцидентов, смена статуса, журнал работ |
| `admin` | `ADMIN2026` | `/admin` | Полный доступ, переход на все страницы |

> **Администратор** может перейти на страницы `/support` и `/engineer` прямо из своей панели.

### Требования к паролю
- Минимум **6 символов**
- Хотя бы одна **ЗАГЛАВНАЯ** буква
- Хотя бы одна **строчная** буква
- Хотя бы одна **цифра**

✅ Пример: `Password1`

---

## 🏗 Структура проекта

```
eosm3-main/
├── backend/
│   └── src/
│       ├── controllers/       # Бизнес-логика (auth, tickets, incidents, messages)
│       ├── models/            # Mongoose модели (User, Ticket, Incident, Message)
│       ├── routes/            # Express маршруты
│       ├── middleware/        # Аутентификация, проверка ролей
│       ├── validators/        # Схемы валидации запросов
│       └── utils/             # Хелперы, JWT utils, построители запросов
├── frontend/
│   └── src/
│       ├── pages/             # loginPage, supportsPage, engineersPage, adminsPage, usersPage
│       ├── services/          # ticketService, incidentService (вызовы API)
│       ├── types/             # TypeScript интерфейсы
│       └── api/               # Axios instance с credentials
└── docker-compose.yml
```

---

## 🔐 Поток аутентификации

1. **Регистрация / Вход** → сервер выдаёт Access Token + Refresh Token через `httpOnly` куки
2. **Access Token** — истекает через 15 минут
3. **Refresh Token** — истекает через 7 дней; при ротации старый JTI заносится в Redis-блэклист
4. **Защита**: `SameSite: Strict` (от CSRF) + `HttpOnly` (от XSS)

---

## 📡 API эндпоинты

### Аутентификация
```
POST /api/auth/register       Регистрация
POST /api/auth/login          Вход
POST /api/auth/logout         Выход
POST /api/auth/refresh        Обновление токенов
GET  /api/auth/me             Текущий пользователь
GET  /api/auth/users          Список пользователей (admin)
```

### Тикеты
```
GET    /api/tickets                Список тикетов
POST   /api/tickets                Создать тикет
PATCH  /api/tickets/:id/status     Сменить статус тикета
DELETE /api/tickets/:id            Удалить тикет
```

### Инциденты
```
GET    /api/incidents              Список инцидентов
GET    /api/incidents/:id          Инцидент по ID
POST   /api/incidents              Создать инцидент (support)
PATCH  /api/incidents/:id/status   Сменить статус (support + engineer)
POST   /api/incidents/:id/updates  Добавить замечание (support + engineer)
PUT    /api/incidents/:id          Полное обновление (support)
DELETE /api/incidents/:id          Удалить (только admin)
```

### Сообщения
```
POST   /api/messages               Отправить сообщение роли (admin, support или engineer)
GET    /api/messages/inbox         Получить все сообщения для текущей роли пользователя
GET    /api/messages/unread        Получить количество непрочитанных сообщений
PATCH  /api/messages/:id/read      Пометить сообщение как прочитанное
```

> Все эндпоинты сообщений требуют аутентификации. Сообщения адресованы роли — каждая роль видит только сообщения, отправленные на её роль.

---

## 💬 Система внутренних сообщений

Роли сотрудников (Admin, Support, Engineer) могут отправлять и получать сообщения через встроенный inbox.

### Как это работает

- Сообщения хранятся в MongoDB в коллекции `messages` (создаётся автоматически при первой отправке)
- Каждое сообщение содержит: `from` (роль отправителя), `fromUsername`, `to` (целевая роль), `text`, `read`, `createdAt`
- Счётчик непрочитанных обновляется каждые **30 секунд** через polling
- При открытии inbox все сообщения автоматически помечаются как прочитанные

### Кто кому может писать

| Отправитель | Может написать |
|-------------|---------------|
| Admin | Support, Engineer |
| Engineer | Support, Admin |
| Support | Admin |

### Новые файлы бэкенда — нужно скопировать в проект

```
backend/src/models/Message.ts                  ← Mongoose модель
backend/src/controllers/messageController.ts   ← send, inbox, markRead, unreadCount
backend/src/routes/messages.ts                 ← описание роутов
```

Также заменить `backend/src/app.ts` — он теперь импортирует и регистрирует роут сообщений:
```typescript
import messageRoutes from './routes/messages';
app.use('/api/messages', messageRoutes);
```

### Пересборка после добавления файлов

```powershell
docker-compose build backend
docker-compose up -d
```

> MongoDB автоматически создаст коллекцию `messages` при первой отправке сообщения — никакой ручной настройки не требуется.

### Inbox на фронтенде (все 3 страницы ролей)

На каждой странице роли есть кнопка **Inbox** со счётчиком непрочитанных:
- **Admin** — кнопка inbox в верхней панели + форма отправки в панели мессенджера
- **Support** — кнопка inbox в хедере (десктоп) / drawer (мобайл) + поле ответа внутри диалога inbox
- **Engineer** — кнопка inbox между кнопками Admin и EXIT (десктоп) / drawer (мобайл)

---

## 🗄 База данных — смена роли вручную

```bash
docker exec -it service-desk-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

use service-desk
db.users.updateOne({ email: "user@example.com" }, { $set: { role: "support" } })
```

---

## 🐳 Docker сервисы

| Контейнер | Описание | Порт |
|-----------|----------|------|
| `service-desk-backend` | Node.js API | 3000 |
| `service-desk-mongodb` | MongoDB | 27017 |
| `service-desk-redis` | Redis кеш | 6379 |

---

## 📋 Справочник статусов

### Статусы тикетов
`new` → `investigating` → `monitoring` → `resolved` → `closed`

### Статусы инцидентов
`new` → `investigating` → `identified` → `monitoring` → `resolved` → `closed`

### Приоритеты инцидентов
`low` · `medium` · `high` · `critical`

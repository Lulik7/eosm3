# Архитектура Service Desk Backend

## Общая архитектура

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

## Система аутентификации

### Flow аутентификации

1. **Пользователь вводит данные**
   ```
   Frontend → POST /api/auth/login
   { email, password }
   ```

2. **Проверка на сервере**
   - проверка пароля (bcrypt)
   - проверка `isActive`

3. **Выставление токенов в httpOnly cookies**
   ```
   Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict
   Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
   ```

4. **Автоматическая отправка cookies с запросами**
   ```
   Cookie: accessToken=...; refreshToken=...
   ```

### Refresh token rotation + Redis blacklist

- `POST /api/auth/refresh` принимает `refreshToken` cookie
- refresh token содержит `jti`
- при успешном refresh:
  - старый `jti` добавляется в Redis blacklist до `exp`
  - клиент получает новый `accessToken` и новый `refreshToken`
- повторное использование старого refresh приводит к `401`

### Почему это безопасно?

- **HttpOnly**: JavaScript не может получить доступ к cookie
- **Secure**: Работает только по HTTPS (включается при `NODE_ENV=production`)
- **SameSite**: Защита от CSRF атак
- **Rotation + blacklist**: предотвращает повторное использование refresh токена

## Модели данных

### User Model (`src/models/User.ts`)

```javascript
{
  _id: ObjectId,
  username: String,      // Уникальное имя пользователя
  email: String,         // Уникальный email
  password: String,      // Хеш пароля (bcrypt)
  role: String,          // user | admin | support
  isActive: Boolean,     // Активен ли аккаунт
  lastLogin: Date,        // Последний вход
  createdAt: Date,       // Дата создания
  updatedAt: Date        // Дата обновления
}
```

**Ключевые методы:**
- `comparePassword()` - проверка пароля
- `toSafeObject()` - возврат без пароля
- `findByEmailWithPassword()` - поиск с паролем

### Request Model (`src/models/Request.ts`)

```javascript
{
  _id: ObjectId,
  title: String,           // Заголовок запроса
  description: String,     // Подробное описание
  category: String,        // hardware | software | network | access | other
  priority: String,        // low | medium | high | urgent
  status: String,          // new | in_progress | pending | resolved | closed
  createdBy: ObjectId,     // Кто создал
  assignedTo: ObjectId,    // Кто назначен
  resolution: String,      // Решение
  tags: [String],          // Теги
  attachments: [{           // Вложения
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String
  }],
  statusHistory: [{        // История изменений
    status: String,
    changedBy: ObjectId,
    changedAt: Date,
    comment: String
  }],
  comments: [{             // Комментарии
    text: String,
    author: ObjectId,
    createdAt: Date,
    isInternal: Boolean    // Видят только сотрудники
  }],
  resolvedAt: Date,        // Время решения
  satisfactionRating: Number, // Оценка 1-5
  satisfactionComment: String
}
```

**Виртуальные поля:**
- `resolutionTime` - время решения
- **Индексы** для быстрого поиска

### Incident Model (`src/models/Incident.ts`)

```javascript
{
  _id: ObjectId,
  incidentNumber: String,  // INC-000001
  title: String,           // Заголовок
  description: String,     // Описание
  severity: String,        // low | medium | high | critical
  status: String,          // new | investigating | identified | monitoring | resolved | closed
  type: String,            // system_failure | performance | security | data_loss | network | other
  affectedServices: [{     // Затронутые сервисы
    name: String,
    impact: String         // partial | full | degraded
  }],
  affectedUsers: {
    estimated: Number,     // Оценка количества
    actual: Number         // Фактическое количество
  },
  detectedAt: Date,        // Когда обнаружен
  startedAt: Date,         // Когда начался
  resolvedAt: Date,        // Когда решен
  createdBy: ObjectId,     // Кто создал
  assignedTo: ObjectId,    // Кто назначен
  responseTeam: [ObjectId], // Команда ответа
  rootCause: String,       // Причина
  resolution: String,      // Решение
  preventionPlan: String,  // План предотвращения
  statusHistory: [{        // История статусов
    status: String,
    changedBy: ObjectId,
    changedAt: Date,
    comment: String
  }],
  updates: [{             // Обновления
    message: String,
    author: ObjectId,
    createdAt: Date,
    isPublic: Boolean      // Публичное или внутреннее
  }],
  relatedRequests: [ObjectId], // Связанные запросы
  impactCost: {            // Стоимость влияния
    estimated: Number,
    actual: Number,
    currency: String
  }
}
```

**Автоматическая генерация номера:**
- `INC-000001`, `INC-000002`, и т.д.

## Middleware система

### Auth Middleware (`src/middleware/auth.ts`)

```javascript
// authenticate() - проверка accessToken cookie
// если cookie отсутствует или токен невалидный -> 401

// requireAdmin() - права администратора
if (req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Требуются права администратора' });
}

// requireSupport() - права поддержки
if (!['admin', 'support'].includes(req.user.role)) {
  return res.status(403).json({ message: 'Требуются права поддержки' });
}
```

## Flow обработки запросов

### Пример: Создание запроса

1. **Frontend отправляет запрос**
   ```
   POST /api/requests
   Headers: Cookie: accessToken=...
   Body: { title, description, category, priority }
   ```

2. **Middleware chain**
   ```
   express.json() → authenticate() → validateRequest() → createRequest()
   ```

3. **Контроллер обрабатывает**
   ```javascript
   // Проверяет валидацию
   const errors = validationResult(req);
   
   // Создает запрос
   const request = new Request({
     title, description, category, priority,
     createdBy: req.user._id // Из middleware
   });
   
   await request.save();
   ```

4. **Ответ клиенту**
   ```javascript
   res.status(201).json({
     success: true,
     message: 'Запрос создан',
     data: request
   });
   ```

## 📈 Оптимизация производительности

### Индексы MongoDB

```javascript
// User
{ email: 1 }           // Уникальный
{ username: 1 }        // Уникальный

// Request
{ createdBy: 1, createdAt: -1 }  // Запросы пользователя
{ status: 1, priority: 1 }       // Фильтрация
{ assignedTo: 1, status: 1 }     // Назначенные запросы

// Incident
{ incidentNumber: 1 }            // Уникальный
{ status: 1, severity: 1 }       // Фильтрация
{ detectedAt: -1 }               // Сортировка по времени
```

### Пагинация

```javascript
const requests = await Request.find(filter)
  .limit(limit * 1)
  .skip((page - 1) * limit)
  .sort(sort);
```

### Агрегация для статистики

```javascript
const stats = await Request.aggregate([
  { $match: filters },
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 },
      avgResolutionTime: { $avg: '$resolutionTime' }
    }
  }
]);
```

## 🔒 Меры безопасности

### 1. Аутентификация
- JWT (access + refresh) через httpOnly cookies
- Refresh rotation + Redis blacklist
- bcrypt для паролей (12 раундов)
- Rate limiting

### 2. Валидация
- Joi/express-validator для всех входных данных
- Проверка форматов email, ObjectId
- Ограничение длины полей

### 3. Защита от атак
- Helmet для HTTP заголовков
- CORS для доменов
- Compression для производительности
- Morgan для логирования

### 4. Обработка ошибок
- Стандартизированные ответы
- Не раскрывает внутреннюю информацию в продакшен
- Логирование ошибок

## 🚀 Масштабирование

### Для продакшена:

1. **Load Balancer**: Nginx
2. **Cluster Mode**: PM2
3. **Monitoring**: Winston, ELK stack
4. **Caching**: Redis для частых запросов

Redis в текущей архитектуре используется как хранилище blacklist для refresh token `jti`.

## 📝 Логирование и мониторинг

### Структура логов:

```javascript
console.log(`[AUTH] register: ${username}`);
console.error('MongoDB connection error:', error);
console.log(`Server started on port ${PORT}`);
```

### Метрики для мониторинга:

- Время ответа API
- Количество refresh blacklist entries (Redis)
- Ошибки аутентификации
- Статистика запросов/инцидентов
- Использование памяти

## 🔄 Жизненный цикл запроса

1. **Создание**: new → in_progress → resolved → closed
2. **Эскалация**: low → medium → high → urgent
3. **История**: каждое изменение статуса записывается
4. **Комментарии**: публичные и внутренние
5. **Оценка**: после закрытия пользователь может оценить

Эта архитектура обеспечивает безопасность, масштабируемость и поддерживаемость системы Service Desk.

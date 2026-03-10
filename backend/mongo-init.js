// Инициализация базы данных Service Desk
db = db.getSiblingDB('service-desk');

// Создаем пользователя для приложения
db.createUser({
  user: 'service-desk-user',
  pwd: 'service-desk-password',
  roles: [
    {
      role: 'readWrite',
      db: 'service-desk'
    }
  ]
});

// Создаем индексы для оптимизации
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.requests.createIndex({ createdBy: 1, createdAt: -1 });
db.requests.createIndex({ status: 1, priority: 1 });
db.requests.createIndex({ assignedTo: 1, status: 1 });

db.incidents.createIndex({ incidentNumber: 1 }, { unique: true });
db.incidents.createIndex({ status: 1, severity: 1 });
db.incidents.createIndex({ detectedAt: -1 });

print('База данных Service Desk инициализирована');

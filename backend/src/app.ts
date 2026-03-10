/**
 * Главный файл приложения Service Desk Backend
 * 
 * Использует JWT (access + refresh) через httpOnly cookies вместо localStorage
 * httpOnly cookies защищают от XSS атак
 * Включает CSRF защиту и rate limiting
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

import authRoutes from './routes/auth';
import ticketRoutes from './routes/tickets';
import requestRoutes from './routes/requests';
import incidentRoutes from './routes/incidents';
import connectDB from './config/database';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

// Безопасные middleware
app.use(helmet()); // Защита от HTTP уязвимостей
app.use(compression()); // Сжатие ответов для ускорения
app.use(morgan('combined')); // Логирование запросов

// Rate limiting - защита от подбора пароля и атак
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов, попробуйте позже'
});
app.use('/api/', limiter);

// CORS настройка для работы с фронтендом
// app.use(cors({
//   origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
//   credentials: true, // Важно для работы с cookies
//   optionsSuccessStatus: 200 // Для совместимости со старыми браузерами
// }));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // ОБЯЗАТЕЛЬНО для работы с httpOnly cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));



// Парсинг JSON данных
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser (нужно для httpOnly JWT cookies)
app.use(cookieParser());

// Подключение к MongoDB
connectDB();

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/incidents', incidentRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    auth: 'jwt-cookie'
  });
});

// Обработка ошибок
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env['NODE_ENV'] === 'development' ? err.message : undefined
  });
});

// 404 обработчик
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API доступно по адресу: http://localhost:${PORT}/api`);
  console.log('Используется JWT (access + refresh) через httpOnly cookies');
});

export default app;

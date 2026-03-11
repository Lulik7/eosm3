/**
 * Главный файл приложения Service Desk Backend
 * 
 * Использует JWT (access + refresh) через httpOnly cookies вместо localStorage
 * httpOnly cookies защищают от XSS атак
 * Включает CSRF защиту и rate limiting
 */

/**
 * Service Desk Backend — Main Application File
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
import messageRoutes from './routes/messages';
import connectDB from './config/database';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), auth: 'jwt-cookie' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? err.message : undefined
  });
});

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  console.log('Using JWT (access + refresh) via httpOnly cookies');
});

export default app;
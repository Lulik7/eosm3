/**
 * Маршруты аутентификации
 * 
 * JWT (access + refresh) передаются через httpOnly cookies
 */

import express from 'express';
import { register, login, refresh, logout, getStatus, getMe, getUsers } from '@/controllers/authController';
import { validateRegister, validateLogin } from '@/validators/authValidator';
import { authenticate } from '@/middleware/auth';

const router = express.Router();

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 * 
 * После успешной регистрации пользователь автоматически авторизуется
 */
router.post('/register', validateRegister, register);

/**
 * POST /api/auth/login
 * Вход пользователя
 * 
 * Выставляет access/refresh токены в httpOnly cookies
 */
router.post('/login', validateLogin, login);

/**
 * POST /api/auth/refresh
 * Обновление access токена по refresh токену
 */
router.post('/refresh', refresh);

/**
 * POST /api/auth/logout
 * Выход пользователя
 */
router.post('/logout', logout);

/**
 * GET /api/auth/status
 * Проверка статуса аутентификации
 */
router.get('/status', getStatus);

/**
 * GET /api/auth/me
 * Получение данных текущего пользователя
 * Возвращает полную информацию о пользователе
 */
router.get('/me', authenticate, getMe);


/**
 * GET /api/auth/users
 * Получение списка всех пользователей
 * Требуется аутентификация (и желательно права админа)
 */
router.get('/users', authenticate, getUsers);

// Если хочешь, чтобы видели только админы, добавь middleware:
// router.get('/users', authenticate, requireAdmin, getUsers);




export default router;

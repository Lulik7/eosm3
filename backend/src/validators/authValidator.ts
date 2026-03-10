/**
 * Валидаторы для маршрутов аутентификации
 * Использует Joi для строгой проверки данных
 */

import { body } from 'express-validator';

/**
 * Валидация данных регистрации
 */
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Имя пользователя должно содержать от 3 до 50 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Имя пользователя может содержать только буквы, цифры и подчеркивания'),
  
  body('email')
    .isEmail()
    .withMessage('Введите корректный email адрес')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать хотя бы одну заглавную букву, одну строчную и одну цифру'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin', 'support', 'engineer'])
    .withMessage('Роль должна быть одной из: user, admin, support,engineer')
];

/**
 * Валидация данных входа
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Введите корректный email адрес')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

export {
  validateRegister,
  validateLogin
};

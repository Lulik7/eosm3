/**
 * Валидаторы для маршрутов запросов
 */

import { body } from 'express-validator';

/**
 * Валидация данных запроса
 */
const validateRequest = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Заголовок должен содержать от 3 до 200 символов'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Описание должно содержать от 10 до 2000 символов'),
  
  body('category')
    .isIn(['hardware', 'software', 'network', 'access', 'other'])
    .withMessage('Неверная категория'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Неверный приоритет'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Теги должны быть массивом'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Тег не может превышать 50 символов')
];

const validateStatusChange = [
  body('status')
    .isIn(['new', 'in_progress', 'pending', 'resolved', 'closed'])
    .withMessage('Неверный статус'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Комментарий не может превышать 500 символов')
];

const validateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Комментарий должен содержать от 1 до 500 символов'),
  
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal должно быть булевым значением')
];

export {
  validateRequest,
  validateStatusChange,
  validateComment
};

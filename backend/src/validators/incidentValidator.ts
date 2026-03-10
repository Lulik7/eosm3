/**
 * Валидаторы для маршрутов инцидентов
 */

import { body } from 'express-validator';

/**
 * Валидация данных инцидента
 */
const validateIncident = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Заголовок должен содержать от 3 до 200 символов'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Описание должно содержать от 10 до 2000 символов'),
  
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Неверный уровень критичности'),
  
  body('type')
    .isIn(['system_failure', 'performance', 'security', 'data_loss', 'network', 'other'])
    .withMessage('Неверный тип инцидента'),
  
  body('affectedServices')
    .optional()
    .isArray()
    .withMessage('Затронутые сервисы должны быть массивом'),
  
  body('affectedUsers')
    .optional()
    .isObject()
    .withMessage('Информация о затронутых пользователях должна быть объектом'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Неверный ID назначенного сотрудника'),
  
  body('responseTeam')
    .optional()
    .isArray()
    .withMessage('Команда ответа должна быть массивом')
];

const validateIncidentStatus = [
  body('status')
    .isIn(['new', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'])
    .withMessage('Неверный статус'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Комментарий не может превышать 500 символов')
];

const validateUpdate = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Сообщение должно содержать от 1 до 500 символов'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic должно быть булевым значением')
];

export {
  validateIncident,
  validateIncidentStatus,
  validateUpdate
};

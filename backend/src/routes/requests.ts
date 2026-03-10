/**
 * Маршруты для работы с запросами Service Desk
 */

import express from 'express';
import {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  changeRequestStatus,
  addComment,
  deleteRequest,
  getRequestsStats
} from '@/controllers/requestController';
import { authenticate, requireSupport, requireAdmin } from '../middleware/auth';
import { validateRequest, validateStatusChange, validateComment } from '@/validators/requestValidator';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/requests
 * Получение списка запросов
 * Требуется аутентификация
 */
router.get('/', getRequests);

/**
 * GET /api/requests/stats
 * Получение статистики по запросам
 * Требуются права поддержки или администратора
 */
router.get('/stats', requireSupport, getRequestsStats);

/**
 * GET /api/requests/:id
 * Получение одного запроса по ID
 * Требуется аутентификация
 */
router.get('/:id', getRequestById);

/**
 * POST /api/requests
 * Создание нового запроса
 * Требуется аутентификация
 */
router.post('/', validateRequest, createRequest);

/**
 * PUT /api/requests/:id
 * Обновление запроса
 * Требуется аутентификация и права на редактирование
 */
router.put('/:id', updateRequest);

/**
 * PATCH /api/requests/:id/status
 * Изменение статуса запроса
 * Требуется аутентификация
 */
router.patch('/:id/status', validateStatusChange, changeRequestStatus);

/**
 * POST /api/requests/:id/comments
 * Добавление комментария к запросу
 * Требуется аутентификация
 */
router.post('/:id/comments', validateComment, addComment);

/**
 * DELETE /api/requests/:id
 * Удаление запроса
 * Требуются права администратора
 */
router.delete('/:id', requireAdmin, deleteRequest);

export default router;

/**
 * Маршруты для работы с инцидентами Service Desk
 */

import express from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  changeIncidentStatus,
  addUpdate,
  deleteIncident,
  getIncidentsStats
} from '@/controllers/incidentController';
import { authenticate, requireSupport, requireAdmin,requireEngineer } from '../middleware/auth';
import { validateIncident, validateIncidentStatus, validateUpdate } from '@/validators/incidentValidator';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/incidents
 * Получение списка инцидентов
 * Требуется аутентификация
 */
router.get('/', getIncidents);

/**
 * GET /api/incidents/stats
 * Получение статистики по инцидентам
 * Требуются права поддержки или администратора
 */
router.get('/stats', requireSupport, getIncidentsStats);

/**
 * GET /api/incidents/:id
 * Получение одного инцидента по ID
 * Требуется аутентификация
 */
router.get('/:id', getIncidentById);

/**
 * POST /api/incidents
 * Создание нового инцидента
 * Требуются права поддержки или администратора
 */
router.post('/', requireSupport, validateIncident, createIncident);

/**
 * PUT /api/incidents/:id
 * Обновление инцидента
 * Требуются права поддержки или администратора
 */
router.put('/:id', requireSupport, validateUpdate, updateIncident);

/**
 * PATCH /api/incidents/:id/status
 * Изменение статуса инцидента
 * Требуются права поддержки,инженера или администратора
 */
router.patch('/:id/status',requireEngineer, requireSupport, validateIncidentStatus, changeIncidentStatus);

/**
 * POST /api/incidents/:id/updates
 * Добавление обновления к инциденту
 * Требуются права поддержки,инженера или администратора
 */
router.post('/:id/updates', requireEngineer,requireSupport, addUpdate);

/**
 * DELETE /api/incidents/:id
 * Удаление инцидента
 * Требуются права администратора
 */
router.delete('/:id', requireAdmin, deleteIncident);

export default router;

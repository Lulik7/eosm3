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
import { authenticate, requireSupport, requireAdmin} from '../middleware/auth';
import { validateIncident, validateIncidentStatus, validateUpdate } from '@/validators/incidentValidator';

const router = express.Router();

router.use(authenticate);

router.get('/', getIncidents);
router.get('/stats', requireSupport, getIncidentsStats);
router.get('/:id', getIncidentById);

router.post('/', requireSupport, validateIncident, createIncident);
router.put('/:id', requireSupport, validateUpdate, updateIncident);

// ИСПРАВЛЕНО: убрали requireEngineer — support уже достаточно
router.patch('/:id/status', requireSupport, validateIncidentStatus, changeIncidentStatus);

// ИСПРАВЛЕНО: убрали requireEngineer — support уже достаточно
router.post('/:id/updates', requireSupport, addUpdate);

router.delete('/:id', requireAdmin, deleteIncident);

export default router;
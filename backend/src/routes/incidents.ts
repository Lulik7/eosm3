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
import { authenticate, requireSupport, requireAdmin } from '../middleware/auth';
import { validateIncident, validateIncidentStatus, validateUpdate } from '@/validators/incidentValidator';

const router = express.Router();

router.use(authenticate);

router.get('/', getIncidents);
router.get('/stats', requireSupport, getIncidentsStats);
router.get('/:id', getIncidentById);

router.post('/', requireSupport, validateIncident, createIncident);
router.put('/:id', requireSupport, validateUpdate, updateIncident);

// Без ограничения по роли — support и engineer могут менять статус
router.patch('/:id/status', validateIncidentStatus, changeIncidentStatus);

// Без ограничения по роли — support и engineer могут добавлять обновления
router.post('/:id/updates', addUpdate);

router.delete('/:id', requireAdmin, deleteIncident);

export default router;

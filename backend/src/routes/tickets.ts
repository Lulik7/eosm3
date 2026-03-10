import express from 'express';
import { getTickets, createTicket, updateTicketStatus } from '@/controllers/ticketController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Аутентификация для всех роутов тикетов
router.use(authenticate);

// Получение тикетов (support/admin видят все, user — только свои)
router.get('/', getTickets);

// Создание нового тикета
router.post('/', createTicket);

// Обновление статуса (Drag-and-Drop)
router.patch('/:id/status', updateTicketStatus);

export default router;
import express from 'express';
// Если у тебя контроллер называется иначе, проверь путь
import { getTickets, createTicket, updateTicketStatus } from '@/controllers/ticketController';

const router = express.Router();

// Маршрут для получения всех тикетов
router.get('/', getTickets);

// Маршрут для создания нового тикета
router.post('/', createTicket);

// Маршрут для обновления статуса (нужен для Drag-and-Drop)
router.patch('/:id/status', updateTicketStatus);

export default router;
import { Router } from 'express';
import { sendMessage, getInbox, markRead, getUnreadCount } from '@/controllers/messageController';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', sendMessage);           // POST /api/messages
router.get('/inbox', getInbox);          // GET  /api/messages/inbox
router.get('/unread', getUnreadCount);   // GET  /api/messages/unread
router.patch('/:id/read', markRead);     // PATCH /api/messages/:id/read

export default router;
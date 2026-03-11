import { Request, Response } from 'express';
import Message from '../models/Message';

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { to, text } = req.body;
        const user = (req as any).user;
        if (!to || !text) return res.status(400).json({ message: 'to and text are required' });

        const msg = await Message.create({
            from: user.role,
            fromUsername: user.username || user.email || user.role,
            to,
            text,
        });
        return res.status(201).json(msg);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to send message' });
    }
};

// Get inbox for current user's role
export const getInbox = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const messages = await Message.find({ to: user.role }).sort({ createdAt: -1 });
        return res.json(messages);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

// Mark message as read
export const markRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { read: true });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to mark as read' });
    }
};

// Get unread count for current user's role
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const count = await Message.countDocuments({ to: user.role, read: false });
        return res.json({ count });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to get count' });
    }
};
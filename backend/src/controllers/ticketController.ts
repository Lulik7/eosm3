import { Request, Response } from 'express';
import { Ticket } from '@/models/Ticket';

export const getTickets = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let tickets;

        if (user.role === "support" || user.role === "admin") {
            // support и admin видят все тикеты, populate createdBy для деталей
            tickets = await Ticket.find()
                .populate('createdBy', 'username email')
                .sort({ createdAt: -1 });
        } else {
            // обычный user видит только свои
            tickets = await Ticket.find({ createdBy: user._id })
                .populate('createdBy', 'username email')
                .sort({ createdAt: -1 });
        }

        res.json(tickets);

    } catch (error) {
        console.error('getTickets error:', error);
        res.status(500).json({ message: "Error fetching tickets" });
    }
};

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { title, description, type } = req.body;
        const ticket = new Ticket({
            ticketNumber: `TCK-${Date.now()}`,
            title,
            description,
            type: type || 'Other',
            status: 'new',
            createdBy: (req as any).user._id
        });

        await ticket.save();
        await ticket.populate('createdBy', 'username email');
        res.status(201).json(ticket);

    } catch (error) {
        console.error('createTicket error:', error);
        res.status(400).json({ message: 'Error creating ticket' });
    }
};

export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedTicket = await Ticket.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('createdBy', 'username email');

        if (!updatedTicket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        res.json(updatedTicket);
    } catch (error) {
        console.error('updateTicketStatus error:', error);
        res.status(400).json({ message: 'Error updating status' });
    }
};

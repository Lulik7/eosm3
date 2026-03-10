import { Request, Response } from 'express';
import { Ticket } from '@/models/Ticket'; // Убедись, что модель Ticket существует

export const getTickets = async (req: Request, res: Response) => {

    try {

        const user = (req as any).user;

        let tickets;

        if (user.role === "support" || user.role === "admin") {

            // support видит все тикеты
            tickets = await Ticket.find();

        } else {

            //------------------------------------------------------------ обычный user видит только свои
            tickets = await Ticket.find({ createdBy: user._id });

        }

        res.json(tickets);

    } catch (error) {

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
            type,
            createdBy: (req as any).user._id

        });

        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        res.status(400).json({ message: 'Error creating ticket' });

    }

};

export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedTicket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
        res.json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: 'Error updating status' });
    }
};
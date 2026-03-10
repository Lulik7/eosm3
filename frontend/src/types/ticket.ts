export type TicketStatus = 'new' | 'in-progress' | 'resolved' | 'closed' | 'investigating' | 'monitoring';

export interface Ticket {
    id?: string;
    _id: string;
    ticketNumber?: string;
    title: string;
    description?: string;
    createdBy?: string | { _id: string; username: string; email: string };
    user?: string;  // оставляем для обратной совместимости
    type?: string;
    status: TicketStatus;
    createdAt?: string;
    incidentCreated?: boolean;
}
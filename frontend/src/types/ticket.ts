export type TicketStatus = 'new' | 'in-progress' | 'resolved' | 'closed';

export interface Ticket {
    id?: string;
    _id: string;
    ticketNumber?: string;  // Полезно для поиска (например, TKT-001)
    title: string;
    description?: string;   // Описание проблемы
    user: string;           // ID пользователя (или объект пользователя)
    type: 'Water Leak' | 'Power Failure' | 'Elevator Issue' | 'Other';
    status: TicketStatus;
    createdAt: string;      // Дата создания из БД
}
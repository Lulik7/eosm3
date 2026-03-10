import mongoose, { Schema } from 'mongoose';

// Описываем интерфейс для Mongoose (как объект выглядит в коде)
export interface Ticket {
    _id?: string
    id?: string
    title: string
    description?: string
    status: "new" | "investigating" | "monitoring" | "resolved" | "closed"
}

// Создаем схему (как данные хранятся в БД)
const TicketSchema: Schema = new Schema({
    ticketNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },

    createdBy: { type: String, required: true },

    type: {
        type: String,
        enum: ['Water Leak', 'Power Failure', 'Elevator Issue', 'Other'],
        required: true
    },

    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved', 'closed'],
        default: 'new'
    }

}, { timestamps: true });

export const Ticket = mongoose.model<Ticket>('Ticket', TicketSchema);
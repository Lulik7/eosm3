import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
    _id: string
    ticketNumber: string
    title: string
    description?: string
    createdBy: mongoose.Types.ObjectId
    type: string
    status: string
    incidentCreated?: boolean
    createdAt: Date
    updatedAt: Date
}

const TicketSchema: Schema = new Schema({
    ticketNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: {
        type: String,
        enum: ['Water Leak', 'Power Failure', 'Elevator Issue', 'Gas Leak', 'Heating Problem', 'Sewage Issue', 'Road Damage', 'Street Light', 'Noise Complaint', 'Other'],
        default: 'Other'
    },

    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved', 'closed', 'investigating', 'monitoring'],
        default: 'new'
    },

    incidentCreated: { type: Boolean, default: false }

}, { timestamps: true });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    from: string;         // role: 'admin' | 'support' | 'engineer'
    fromUsername: string;
    to: string;           // role: 'admin' | 'support' | 'engineer'
    text: string;
    read: boolean;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    from: { type: String, required: true },
    fromUsername: { type: String, default: 'Admin' },
    to: { type: String, required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
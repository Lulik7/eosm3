
import { Ticket } from "../types/ticket";
import api from "../api/axios";

export const ticketService = {

    getTickets: async (): Promise<Ticket[]> => {
        const res = await api.get("/tickets");
        return res.data;
    },

    createTicket: async (data: Partial<Ticket>): Promise<Ticket> => {
        const res = await api.post("/tickets", data);
        return res.data;
    },

    updateStatus: async (id: string, status: string): Promise<Ticket> => {
        const res = await api.put(`/tickets/${id}/status`, { status });
        return res.data;
    }

};
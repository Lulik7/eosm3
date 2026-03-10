import { Ticket } from "../types/ticket";
import api from "../api/axios";

export const ticketService = {

    getTickets: async (): Promise<Ticket[]> => {
        const res = await api.get("/tickets");
        const raw = res.data;
        // Бэкенд возвращает массив напрямую
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.tickets)) return raw.data.tickets;
        if (Array.isArray(raw?.tickets)) return raw.tickets;
        return [];
    },

    createTicket: async (data: Partial<Ticket>): Promise<Ticket> => {
        const res = await api.post("/tickets", data);
        const raw = res.data;
        if (raw?.data?.ticket) return raw.data.ticket;
        if (raw?.data) return raw.data;
        return raw;
    },

    // ИСПРАВЛЕНО: PUT → PATCH (совпадает с роутом)
    updateStatus: async (id: string, status: string): Promise<Ticket> => {
        const res = await api.patch(`/tickets/${id}/status`, { status });
        const raw = res.data;
        if (raw?.data?.ticket) return raw.data.ticket;
        if (raw?.data) return raw.data;
        return raw;
    }

};
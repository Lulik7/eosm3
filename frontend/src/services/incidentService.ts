import api from '../api/axios';
import { Incident } from '../types/incident';

export const incidentService = {
    getAll: async (): Promise<Incident[]> => {
        const response = await api.get('/incidents');
        const raw = response.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.incidents)) return raw.data.incidents;
        if (Array.isArray(raw?.incidents)) return raw.incidents;
        return [];
    },

    create: async (data: Partial<Incident>): Promise<Incident> => {
        const response = await api.post('/incidents', data);
        const raw = response.data;
        if (raw?.data?.incident) return raw.data.incident;
        if (raw?.data) return raw.data;
        return raw;
    },

    updateStatus: async (id: string, status: string): Promise<Incident> => {
        const res = await api.patch(`/incidents/${id}/status`, { status });
        const raw = res.data;
        if (raw?.data?.incident) return raw.data.incident;
        if (raw?.data) return raw.data;
        return raw;
    }
};

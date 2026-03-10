import api from '../api/axios';
import { Incident } from '../types/incident'; // Убедись, что тип Incident импортирован

export const incidentService = {
    getAll: async (): Promise<Incident[]> => {
        const response = await api.get('/incidents');
        return response.data;
    },
    // Тот самый метод create, который ты хотела добавить:
    create: async (data: Partial<Incident>): Promise<Incident> => {
        const response = await api.post('/incidents', data);
        return response.data;
    }
};
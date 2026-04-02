import { api } from './api';

export const PatientService = {
  list: async (page: number = 1, limit: number = 20, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    const response = await api.get(`/patients?${params.toString()}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/patients', data);
    return response.data;
  },
  getHistory: async (id: string) => {
    const response = await api.get(`/patients/${id}/history`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/patients/${id}`, data);
    return response.data;
  }
};

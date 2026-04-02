import { api } from './api';

export const PrescriptionService = {
  create: async (data: any) => {
    const response = await api.post('/prescriptions', data);
    return response.data;
  },
  bulkCreate: async (data: any[]) => {
    const response = await api.post('/prescriptions/bulk', data);
    return response.data;
  },
  getHistory: async (patientId: string) => {
    const response = await api.get(`/prescriptions/patient/${patientId}`);
    return response.data;
  },
  listAll: async (page: number = 1, limit: number = 20, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    const response = await api.get(`/prescriptions?${params.toString()}`);
    return response.data;
  },
};

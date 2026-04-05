import { api } from './api';

export const CommunicationService = {
  getLogs: async (page: number = 1, limit: number = 20, status?: string, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await api.get(`/communication/logs?${params.toString()}`);
    return response.data;
  }
};

import { api } from './api';

export const AuditService = {
  list: async (page = 1, limit = 10) => {
    const response = await api.get('/audit', { params: { page, limit } });
    return response.data;
  }
};

import { api } from './api';

export const PharmacyService = {
  getDetails: async (id: string) => {
    const response = await api.get(`/pharmacies/${id}`);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/pharmacies/${id}`, data);
    return response.data;
  }
};

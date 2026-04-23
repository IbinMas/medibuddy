import { api } from './api';

export const AuthService = {
  login: async (data: any) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  onboardPharmacy: async (data: any) => {
    const response = await api.post('/pharmacies/onboard', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },
  listInvites: async () => {
    const response = await api.get('/auth/invites');
    return response.data;
  },
  createInvite: async (data: any) => {
    const response = await api.post('/auth/invite', data);
    return response.data;
  },
  resendInvite: async (inviteId: string) => {
    const response = await api.post(`/auth/invites/${inviteId}/resend`);
    return response.data;
  },
  revokeInvite: async (inviteId: string) => {
    const response = await api.post(`/auth/invites/${inviteId}/revoke`);
    return response.data;
  },
  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },
  resetPassword: async (data: { code: string; password: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
  acceptInvite: async (data: any) => {
    const response = await api.post('/auth/accept-invite', data);
    return response.data;
  }
};

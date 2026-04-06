import api from '../client';

export const auditService = {
  findAll: async (params?: { userId?: string; action?: string; entityType?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/audit/logs', { params });
    return data;
  },
};

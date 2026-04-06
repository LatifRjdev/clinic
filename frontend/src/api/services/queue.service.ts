import api from '../client';

export const queueService = {
  getQueue: async (params?: { date?: string; branchId?: string; doctorId?: string }) => {
    const { data } = await api.get('/queue', { params });
    return data;
  },

  callNext: async (doctorId: string, branchId?: string) => {
    const { data } = await api.post('/queue/call-next', { doctorId, branchId });
    return data;
  },

  updateStatus: async (id: string, status: 'completed' | 'no_show' | 'cancelled') => {
    const { data } = await api.patch(`/queue/${id}/status`, { status });
    return data;
  },
};

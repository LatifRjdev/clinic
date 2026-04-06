import api from '../client';

export const storageService = {
  upload: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = folder ? `?folder=${folder}` : '';
    const { data } = await api.post(`/storage/upload${params}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getUrl: async (key: string) => {
    const { data } = await api.get(`/storage/url/${key}`);
    return data.url as string;
  },

  delete: async (key: string) => {
    const { data } = await api.delete(`/storage/${key}`);
    return data;
  },

  list: async (prefix: string = '') => {
    const { data } = await api.get('/storage/list', { params: { prefix } });
    return data.files as string[];
  },
};

import api from '../client';
import type { PaginatedResponse } from '../../types';

export interface Document {
  id: string;
  patientId?: string;
  userId: string;
  title: string;
  type: string;
  templateName?: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  signedBy?: string;
  signedAt?: string;
  createdAt: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export const documentsService = {
  findAll: async (params?: { patientId?: string; type?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/documents', { params });
    return data as PaginatedResponse<Document>;
  },

  findOne: async (id: string) => {
    const { data } = await api.get(`/documents/${id}`);
    return data as Document;
  },

  create: async (doc: Partial<Document>) => {
    const { data } = await api.post('/documents', doc);
    return data as Document;
  },

  update: async (id: string, doc: Partial<Document>) => {
    const { data } = await api.patch(`/documents/${id}`, doc);
    return data as Document;
  },

  delete: async (id: string) => {
    await api.delete(`/documents/${id}`);
  },

  download: async (id: string) => {
    const { data } = await api.get(`/documents/${id}/download`);
    return data as { fileUrl: string; mimeType: string };
  },

  getTemplates: async () => {
    const { data } = await api.get('/documents/templates');
    return data as DocumentTemplate[];
  },

  generatePdf: async (templateId: string, variables: Record<string, string>, patientId?: string) => {
    const { data } = await api.post('/documents/generate-pdf', { templateId, variables, patientId });
    return data;
  },
};

import apiClient from '../client';
import type { Campaign, Promotion, PaginatedResponse } from '../../types';

export const marketingService = {
  // Campaigns
  findAllCampaigns: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Campaign>>('/marketing/campaigns', { params }).then((r) => r.data),

  findCampaign: (id: string) =>
    apiClient.get<Campaign>(`/marketing/campaigns/${id}`).then((r) => r.data),

  createCampaign: (data: Partial<Campaign>) =>
    apiClient.post<Campaign>('/marketing/campaigns', data).then((r) => r.data),

  updateCampaign: (id: string, data: Partial<Campaign>) =>
    apiClient.patch<Campaign>(`/marketing/campaigns/${id}`, data).then((r) => r.data),

  removeCampaign: (id: string) =>
    apiClient.delete(`/marketing/campaigns/${id}`),

  // Promotions
  findAllPromotions: (params?: { isActive?: boolean; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Promotion>>('/marketing/promotions', { params }).then((r) => r.data),

  findPromotion: (id: string) =>
    apiClient.get<Promotion>(`/marketing/promotions/${id}`).then((r) => r.data),

  createPromotion: (data: Partial<Promotion>) =>
    apiClient.post<Promotion>('/marketing/promotions', data).then((r) => r.data),

  updatePromotion: (id: string, data: Partial<Promotion>) =>
    apiClient.patch<Promotion>(`/marketing/promotions/${id}`, data).then((r) => r.data),

  removePromotion: (id: string) =>
    apiClient.delete(`/marketing/promotions/${id}`),

  validatePromoCode: (code: string) =>
    apiClient.get<Promotion>('/marketing/promo-code/validate', { params: { code } }).then((r) => r.data),
};

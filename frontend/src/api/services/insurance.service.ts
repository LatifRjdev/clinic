import apiClient from '../client';
import type { InsuranceCompany, InsuranceRegistry, PaginatedResponse } from '../../types';

export const insuranceService = {
  // Companies
  findAllCompanies: (params?: { isActive?: boolean }) =>
    apiClient.get<InsuranceCompany[]>('/insurance/companies', { params }).then((r) => r.data),

  findCompany: (id: string) =>
    apiClient.get<InsuranceCompany>(`/insurance/companies/${id}`).then((r) => r.data),

  createCompany: (data: Partial<InsuranceCompany>) =>
    apiClient.post<InsuranceCompany>('/insurance/companies', data).then((r) => r.data),

  updateCompany: (id: string, data: Partial<InsuranceCompany>) =>
    apiClient.patch<InsuranceCompany>(`/insurance/companies/${id}`, data).then((r) => r.data),

  removeCompany: (id: string) =>
    apiClient.delete(`/insurance/companies/${id}`),

  // Registries
  findAllRegistries: (params?: { companyId?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<InsuranceRegistry>>('/insurance/registries', { params }).then((r) => r.data),

  createRegistry: (data: { companyId: string; periodStart: string; periodEnd: string }) =>
    apiClient.post<InsuranceRegistry>('/insurance/registries', data).then((r) => r.data),

  submitRegistry: (id: string) =>
    apiClient.post(`/insurance/registries/${id}/submit`).then((r) => r.data),

  updateRegistryStatus: (id: string, status: string) =>
    apiClient.patch(`/insurance/registries/${id}/status`, { status }).then((r) => r.data),

  // Coverage
  checkCoverage: (companyId: string, serviceCode: string) =>
    apiClient.get('/insurance/coverage/check', { params: { companyId, serviceCode } }).then((r) => r.data),
};

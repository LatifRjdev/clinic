import apiClient from '../client';
import type { Service, Invoice, Expense, CashRegister, CashRegisterTransaction, PaginatedResponse } from '../../types';

export const servicesService = {
  findAll: (params?: { category?: string; isActive?: boolean; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Service>>('/billing/services', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Service>(`/billing/services/${id}`).then((r) => r.data),

  create: (data: Partial<Service>) =>
    apiClient.post<Service>('/billing/services', data).then((r) => r.data),

  update: (id: string, data: Partial<Service>) =>
    apiClient.patch<Service>(`/billing/services/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/billing/services/${id}`),

  getCategories: () =>
    apiClient.get<string[]>('/billing/services/categories').then((r) => r.data),
};

export const invoicesService = {
  findAll: (params?: { patientId?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Invoice>>('/billing/invoices', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Invoice>(`/billing/invoices/${id}`).then((r) => r.data),

  create: (data: Partial<Invoice>) =>
    apiClient.post<Invoice>('/billing/invoices', data).then((r) => r.data),

  update: (id: string, data: Partial<Invoice>) =>
    apiClient.patch<Invoice>(`/billing/invoices/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/billing/invoices/${id}`),

  refund: (id: string) =>
    apiClient.post(`/billing/invoices/${id}/refund`).then((r) => r.data),

  findOverdue: () =>
    apiClient.get<Invoice[]>('/billing/invoices/overdue').then((r) => r.data),

  downloadPdf: (id: string) =>
    apiClient.get(`/pdf/invoice/${id}`, { responseType: 'blob' }).then((r) => r.data),
};

export const expensesService = {
  findAll: (params?: { category?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Expense>>('/billing/expenses', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Expense>(`/billing/expenses/${id}`).then((r) => r.data),

  create: (data: Partial<Expense>) =>
    apiClient.post<Expense>('/billing/expenses', data).then((r) => r.data),

  update: (id: string, data: Partial<Expense>) =>
    apiClient.patch<Expense>(`/billing/expenses/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/billing/expenses/${id}`),

  approve: (id: string) =>
    apiClient.post(`/billing/expenses/${id}/approve`).then((r) => r.data),
};

export const cashRegisterService = {
  getCurrent: () =>
    apiClient.get<CashRegister>('/billing/cash-register/current').then((r) => r.data),

  open: (openingAmount: number) =>
    apiClient.post<CashRegister>('/billing/cash-register/open', { openingAmount }).then((r) => r.data),

  close: () =>
    apiClient.post<CashRegister>('/billing/cash-register/close').then((r) => r.data),

  encashment: (amount: number) =>
    apiClient.post<CashRegister>('/billing/cash-register/encashment', { amount }).then((r) => r.data),

  addTransaction: (registerId: string, data: { type: string; amount: number; description?: string }) =>
    apiClient.post<CashRegisterTransaction>(`/billing/cash-register/${registerId}/transaction`, data).then((r) => r.data),

  getTransactions: (registerId: string) =>
    apiClient.get<CashRegisterTransaction[]>(`/billing/cash-register/${registerId}/transactions`).then((r) => r.data),
};

import apiClient from '../client';
import type { PayrollEntry, PayrollSettings, PaginatedResponse } from '../../types';

export const payrollService = {
  // Settings
  getSettings: (userId: string) =>
    apiClient.get<PayrollSettings>(`/payroll/settings/${userId}`).then((r) => r.data),

  upsertSettings: (employeeId: string, data: Partial<PayrollSettings>) =>
    apiClient.patch<PayrollSettings>(`/payroll/settings/${employeeId}`, data).then((r) => r.data),

  // Entries
  findAll: (params?: { year?: number; month?: number; status?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<PayrollEntry>>('/payroll', { params }).then((r) => r.data),

  calculate: (employeeId: string, year: number, month: number) =>
    apiClient.post('/payroll/calculate', { employeeId, year, month }).then((r) => r.data),

  approve: (id: string) =>
    apiClient.post(`/payroll/${id}/approve`).then((r) => r.data),

  markPaid: (id: string) =>
    apiClient.post(`/payroll/${id}/pay`).then((r) => r.data),

  update: (id: string, data: { serviceBonus?: number; deductions?: number; deductionReason?: string }) =>
    apiClient.patch<PayrollEntry>(`/payroll/${id}`, data).then((r) => r.data),

  getSheet: (year: number, month: number) =>
    apiClient.get('/payroll/sheet', { params: { year, month } }).then((r) => r.data),
};

import apiClient from '../client';

export interface ReportParams {
  dateFrom: string;
  dateTo: string;
  branchId?: string;
}

export const reportsService = {
  getRevenue: (params: ReportParams) =>
    apiClient.get('/reports/revenue', { params }).then((r) => r.data),

  getExpenses: (params: ReportParams) =>
    apiClient.get('/reports/expenses', { params }).then((r) => r.data),

  getProfitLoss: (params: ReportParams) =>
    apiClient.get('/reports/profit-loss', { params }).then((r) => r.data),

  getCashFlow: (params: ReportParams) =>
    apiClient.get('/reports/cash-flow', { params }).then((r) => r.data),

  getRevenueByServices: (params: ReportParams) =>
    apiClient.get('/reports/services', { params }).then((r) => r.data),

  getRevenueByDoctors: (params: ReportParams) =>
    apiClient.get('/reports/doctors', { params }).then((r) => r.data),

  getTaxReport: (params: { year: number; quarter: number }) =>
    apiClient.get('/reports/tax', { params }).then((r) => r.data),

  getCustomReport: (data: {
    dataSource: string;
    columns: string[];
    filters?: { dateFrom?: string; dateTo?: string; doctorId?: string; status?: string; category?: string };
    groupBy?: string;
  }) =>
    apiClient.post('/reports/custom', data).then((r) => r.data),
};

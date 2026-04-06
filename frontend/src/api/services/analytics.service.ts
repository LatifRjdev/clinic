import apiClient from '../client';
import type { DashboardData } from '../../types';

export interface AnalyticsParams {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

export const analyticsService = {
  getDashboard: (role?: string) =>
    apiClient.get<DashboardData>(role ? `/analytics/dashboard/${role}` : '/analytics/dashboard').then((r) => r.data),

  getAppointmentStats: (params?: AnalyticsParams) =>
    apiClient.get('/analytics/appointments', { params }).then((r) => r.data),

  getRevenueAnalytics: (params?: AnalyticsParams) =>
    apiClient.get('/analytics/revenue', { params }).then((r) => r.data),

  getDoctorLoad: (params?: AnalyticsParams) =>
    apiClient.get('/analytics/doctors', { params }).then((r) => r.data),

  getPatientStats: (params?: AnalyticsParams) =>
    apiClient.get('/analytics/patients', { params }).then((r) => r.data),

  getServiceStats: (params?: AnalyticsParams) =>
    apiClient.get('/analytics/services', { params }).then((r) => r.data),

  getTrends: (params?: { months?: number }) =>
    apiClient.get('/analytics/trends', { params }).then((r) => r.data),
};

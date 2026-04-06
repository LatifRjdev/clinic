import { useQuery } from '@tanstack/react-query';
import { analyticsService, type AnalyticsParams } from '../api/services/analytics.service';

export const useDashboard = (role?: string) =>
  useQuery({
    queryKey: ['analytics', 'dashboard', role],
    queryFn: () => analyticsService.getDashboard(role),
  });

export const useAppointmentStats = (params?: AnalyticsParams) =>
  useQuery({
    queryKey: ['analytics', 'appointments', params],
    queryFn: () => analyticsService.getAppointmentStats(params),
  });

export const useRevenueAnalytics = (params?: AnalyticsParams) =>
  useQuery({
    queryKey: ['analytics', 'revenue', params],
    queryFn: () => analyticsService.getRevenueAnalytics(params),
  });

export const useDoctorLoad = (params?: AnalyticsParams) =>
  useQuery({
    queryKey: ['analytics', 'doctors', params],
    queryFn: () => analyticsService.getDoctorLoad(params),
  });

export const usePatientStats = (params?: AnalyticsParams) =>
  useQuery({
    queryKey: ['analytics', 'patients', params],
    queryFn: () => analyticsService.getPatientStats(params),
  });

export const useServiceStats = (params?: AnalyticsParams) =>
  useQuery({
    queryKey: ['analytics', 'services', params],
    queryFn: () => analyticsService.getServiceStats(params),
  });

export const useTrends = (months?: number) =>
  useQuery({
    queryKey: ['analytics', 'trends', months],
    queryFn: () => analyticsService.getTrends({ months }),
  });

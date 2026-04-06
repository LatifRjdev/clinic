import apiClient from '../client';
import type { MedicalRecord, Prescription, Referral, VitalSigns, EmrTemplate, PaginatedResponse } from '../../types';

export const medicalRecordsService = {
  findAll: (params?: { patientId?: string; doctorId?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string }) =>
    apiClient.get<PaginatedResponse<MedicalRecord>>('/emr/records', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<MedicalRecord>(`/emr/records/${id}`).then((r) => r.data),

  create: (data: Partial<MedicalRecord>) =>
    apiClient.post<MedicalRecord>('/emr/records', data).then((r) => r.data),

  update: (id: string, data: Partial<MedicalRecord>) =>
    apiClient.patch<MedicalRecord>(`/emr/records/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/emr/records/${id}`),

  sign: (id: string, signatureData?: { signatureImage?: string }) =>
    apiClient.post(`/emr/records/${id}/sign`, signatureData || {}).then((r) => r.data),

  amend: (id: string, data: Partial<MedicalRecord>) =>
    apiClient.post(`/emr/records/${id}/amend`, data).then((r) => r.data),
};

export const prescriptionsService = {
  findAll: (params?: { medicalRecordId?: string; patientId?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Prescription>>('/emr/prescriptions', { params }).then((r) => r.data),

  create: (data: Partial<Prescription>) =>
    apiClient.post<Prescription>('/emr/prescriptions', data).then((r) => r.data),

  update: (id: string, data: Partial<Prescription>) =>
    apiClient.patch<Prescription>(`/emr/prescriptions/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/emr/prescriptions/${id}`),
};

export const referralsService = {
  findAll: (params?: { patientId?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Referral>>('/emr/referrals', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Referral>(`/emr/referrals/${id}`).then((r) => r.data),

  create: (data: Partial<Referral>) =>
    apiClient.post<Referral>('/emr/referrals', data).then((r) => r.data),

  update: (id: string, data: Partial<Referral>) =>
    apiClient.patch<Referral>(`/emr/referrals/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/emr/referrals/${id}`),

  changeStatus: (id: string, status: string) =>
    apiClient.patch(`/emr/referrals/${id}/status`, { status }).then((r) => r.data),
};

export const vitalSignsService = {
  findByPatient: (patientId: string) =>
    apiClient.get<VitalSigns[]>(`/emr/vitals/patient/${patientId}`).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<VitalSigns>(`/emr/vitals/${id}`).then((r) => r.data),

  create: (data: Partial<VitalSigns>) =>
    apiClient.post<VitalSigns>('/emr/vitals', data).then((r) => r.data),

  update: (id: string, data: Partial<VitalSigns>) =>
    apiClient.patch<VitalSigns>(`/emr/vitals/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/emr/vitals/${id}`),

  getChart: (patientId: string, days?: number) =>
    apiClient.get(`/emr/vitals/patient/${patientId}/chart`, { params: { days } }).then((r) => r.data),
};

export const templatesService = {
  findAll: (params?: { specialty?: string }) =>
    apiClient.get<PaginatedResponse<EmrTemplate>>('/emr/templates', { params }).then((r) => r.data),

  create: (data: Partial<EmrTemplate>) =>
    apiClient.post<EmrTemplate>('/emr/templates', data).then((r) => r.data),

  update: (id: string, data: Partial<EmrTemplate>) =>
    apiClient.patch<EmrTemplate>(`/emr/templates/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/emr/templates/${id}`),
};

export const pdfService = {
  downloadPrescription: (id: string) =>
    apiClient.get(`/pdf/prescription/${id}`, { responseType: 'blob' }).then((r) => r.data),
};

export const attachmentsService = {
  upload: (recordId: string, formData: FormData) =>
    apiClient.post(`/emr/records/${recordId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
};

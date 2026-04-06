import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalRecordsService, prescriptionsService, referralsService, vitalSignsService, templatesService } from '../api/services/emr.service';
import type { MedicalRecord, Prescription, Referral, VitalSigns, EmrTemplate } from '../types';

// Medical Records
export const useMedicalRecords = (params?: { patientId?: string; doctorId?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string }) =>
  useQuery({
    queryKey: ['medical-records', params],
    queryFn: () => medicalRecordsService.findAll(params),
  });

export const useMedicalRecord = (id: string) =>
  useQuery({
    queryKey: ['medical-records', id],
    queryFn: () => medicalRecordsService.findOne(id),
    enabled: !!id,
  });

export const useCreateMedicalRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicalRecord>) => medicalRecordsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-records'] }),
  });
};

export const useUpdateMedicalRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicalRecord> }) =>
      medicalRecordsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-records'] }),
  });
};

export const useSignMedicalRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureImage }: { id: string; signatureImage?: string }) =>
      medicalRecordsService.sign(id, signatureImage ? { signatureImage } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-records'] }),
  });
};

export const useAmendMedicalRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicalRecord> }) =>
      medicalRecordsService.amend(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-records'] }),
  });
};

// Prescriptions
export const usePrescriptions = (params?: { medicalRecordId?: string; patientId?: string }) =>
  useQuery({
    queryKey: ['prescriptions', params],
    queryFn: () => prescriptionsService.findAll(params),
    enabled: !!params?.medicalRecordId || !!params?.patientId,
  });

export const useCreatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Prescription>) => prescriptionsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  });
};

export const useDeletePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  });
};

// Referrals
export const useReferrals = (params?: { patientId?: string; status?: string }) =>
  useQuery({
    queryKey: ['referrals', params],
    queryFn: () => referralsService.findAll(params),
  });

export const useCreateReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Referral>) => referralsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
};

export const useChangeReferralStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      referralsService.changeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
};

// Vital Signs
export const useVitalSigns = (patientId: string) =>
  useQuery({
    queryKey: ['vital-signs', patientId],
    queryFn: () => vitalSignsService.findByPatient(patientId),
    enabled: !!patientId,
  });

export const useVitalSignsChart = (patientId: string, days?: number) =>
  useQuery({
    queryKey: ['vital-signs', patientId, 'chart', days],
    queryFn: () => vitalSignsService.getChart(patientId, days),
    enabled: !!patientId,
  });

export const useCreateVitalSigns = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VitalSigns>) => vitalSignsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vital-signs'] }),
  });
};

// Templates
export const useTemplates = (params?: { specialty?: string }) =>
  useQuery({
    queryKey: ['emr-templates', params],
    queryFn: () => templatesService.findAll(params),
  });

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmrTemplate>) => templatesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emr-templates'] }),
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsService, type PatientFilters } from '../api/services/patients.service';
import type { Patient } from '../types';

export const usePatients = (params?: PatientFilters) =>
  useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsService.findAll(params),
  });

export const usePatient = (id: string) =>
  useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsService.findOne(id),
    enabled: !!id,
  });

export const usePatientSearch = (query: string) =>
  useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: () => patientsService.search(query),
    enabled: query.length >= 2,
  });

export const usePatientHistory = (id: string) =>
  useQuery({
    queryKey: ['patients', id, 'history'],
    queryFn: () => patientsService.getHistory(id),
    enabled: !!id,
  });

export const usePatientTimeline = (id: string) =>
  useQuery({
    queryKey: ['patients', id, 'timeline'],
    queryFn: () => patientsService.getTimeline(id),
    enabled: !!id,
  });

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Patient>) => patientsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
};

export const useUpdatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      patientsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
};

export const useDeletePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
};

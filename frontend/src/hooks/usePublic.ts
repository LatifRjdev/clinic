import { useQuery, useMutation } from '@tanstack/react-query';
import { publicService, type BookAppointmentData, type RegisterPatientData } from '../api/services/public.service';

export const usePublicStats = () =>
  useQuery({
    queryKey: ['public-stats'],
    queryFn: () => publicService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export const usePublicDoctors = (specialty?: string) =>
  useQuery({
    queryKey: ['public-doctors', specialty],
    queryFn: () => publicService.getDoctors(specialty ? { specialty } : undefined),
  });

export const usePublicSpecialties = () =>
  useQuery({
    queryKey: ['public-specialties'],
    queryFn: () => publicService.getSpecialties(),
  });

export const usePublicDoctorProfile = (id: string) =>
  useQuery({
    queryKey: ['public-doctor', id],
    queryFn: () => publicService.getDoctorProfile(id),
    enabled: !!id,
  });

export const usePublicSlots = (doctorId?: string, date?: string) =>
  useQuery({
    queryKey: ['public-slots', doctorId, date],
    queryFn: () => publicService.getSlots(doctorId!, date!),
    enabled: !!doctorId && !!date,
  });

export const usePublicServices = (category?: string) =>
  useQuery({
    queryKey: ['public-services', category],
    queryFn: () => publicService.getServices(category),
  });

export const usePublicBookAppointment = () =>
  useMutation({
    mutationFn: (data: BookAppointmentData) => publicService.bookAppointment(data),
  });

export const usePublicDoctorReviews = (doctorId: string) =>
  useQuery({
    queryKey: ['public-doctor-reviews', doctorId],
    queryFn: () => publicService.getDoctorReviews(doctorId),
    enabled: !!doctorId,
  });

export const usePublicDoctorRating = (doctorId: string) =>
  useQuery({
    queryKey: ['public-doctor-rating', doctorId],
    queryFn: () => publicService.getDoctorRating(doctorId),
    enabled: !!doctorId,
  });

export const useRegisterPatient = () =>
  useMutation({
    mutationFn: (data: RegisterPatientData) => publicService.registerPatient(data),
  });

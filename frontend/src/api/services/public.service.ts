import publicClient from '../publicClient';

export interface BookAppointmentData {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  patientFirstName: string;
  patientLastName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
  type?: string;
}

export interface RegisterPatientData {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  password: string;
  dateOfBirth?: string;
}

export const publicService = {
  getStats: () =>
    publicClient.get('/public/stats').then((r) => r.data),

  getDoctors: (params?: { specialty?: string; search?: string }) =>
    publicClient.get('/public/doctors', { params }).then((r) => r.data),

  getSpecialties: () =>
    publicClient.get('/public/specialties').then((r) => r.data),

  getDoctorProfile: (id: string) =>
    publicClient.get(`/public/doctors/${id}`).then((r) => r.data),

  getSlots: (doctorId: string, date: string) =>
    publicClient.get('/public/slots', { params: { doctorId, date } }).then((r) => r.data),

  getServices: (category?: string) =>
    publicClient.get('/public/services', { params: { category } }).then((r) => r.data),

  bookAppointment: (data: BookAppointmentData) =>
    publicClient.post('/public/appointments', data).then((r) => r.data),

  getDoctorReviews: (doctorId: string) =>
    publicClient.get(`/public/doctors/${doctorId}/reviews`).then((r) => r.data),

  getDoctorRating: (doctorId: string) =>
    publicClient.get(`/public/doctors/${doctorId}/rating`).then((r) => r.data),

  registerPatient: (data: RegisterPatientData) =>
    publicClient.post('/auth/register-patient', data).then((r) => r.data),

  postContactMessage: (data: { name: string; email: string; message: string }) =>
    publicClient.post('/public/contact', data).then((r) => r.data),

  getDefaultCurrency: () =>
    publicClient.get<{ currency: string }>('/public/currency').then((r) => r.data),
};

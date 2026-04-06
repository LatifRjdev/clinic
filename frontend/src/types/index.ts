export enum UserRole {
  OWNER = 'owner',
  CHIEF_DOCTOR = 'chief_doctor',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  NURSE = 'nurse',
  ACCOUNTANT = 'accountant',
  SYSADMIN = 'sysadmin',
  RECEPTION = 'reception',
  PATIENT = 'patient',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  preferredLanguage: 'ru' | 'tj';
  departmentId?: string;
  branchId?: string;
  specialty?: string;
  qualification?: string;
  licenseNumber?: string;
  photoUrl?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phone?: string;
  email?: string;
  address?: string;
  passportNumber?: string;
  photoUrl?: string;
  bloodType?: string;
  allergies?: string;
  tags?: string[];
  source?: string;
  notes?: string;
  consentGiven: boolean;
  consentDate?: string;
  insurancePolicyNumber?: string;
  insuranceCompanyId?: string;
  branchId?: string;
  createdAt: string;
}

export type AppointmentType = 'primary' | 'follow_up' | 'procedure' | 'consultation';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentSource = 'reception' | 'online' | 'referral';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  roomId?: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  source: AppointmentSource;
  cancellationReason?: string;
  notes?: string;
  isOnline: boolean;
  patient?: Patient;
  doctor?: User;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  number: string;
  floor?: string;
  isActive: boolean;
  description?: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  roomId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  slotDuration: number;
  isActive: boolean;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  complaints: string;
  anamnesis: string;
  examination: string;
  diagnosis: string;
  diagnosisCode?: string;
  recommendations?: string;
  notes?: string;
  status: 'draft' | 'signed' | 'amended';
  signedAt?: string;
  signatureHash?: string;
  signedById?: string;
  signatureImage?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicalRecordId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Referral {
  id: string;
  patientId: string;
  referringDoctorId: string;
  targetDoctorId?: string;
  targetSpecialty: string;
  reason: string;
  notes?: string;
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'created' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  price: number;
  duration: number;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  patientId: string;
  invoiceNumber: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded';
  paidAt?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdById: string;
  assigneeId?: string;
  departmentId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'message' | 'task' | 'referral' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headDoctorId?: string;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// --- Branches ---

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  workingHours?: Record<string, { start: string; end: string }>;
  isMain: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

// --- Vital Signs ---

export interface VitalSigns {
  id: string;
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  glucose?: number;
  measuredAt: string;
  createdAt: string;
}

// --- Billing: Expense ---

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'salary'
  | 'supplies'
  | 'equipment'
  | 'marketing'
  | 'other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  paidTo?: string;
  branchId?: string;
  createdById?: string;
  approvedById?: string;
  isApproved: boolean;
  createdAt: string;
}

// --- Billing: Cash Register ---

export type CashRegisterStatus = 'open' | 'closed';

export interface CashRegister {
  id: string;
  branchId?: string;
  openedById: string;
  closedById?: string;
  status: CashRegisterStatus;
  openingAmount: number;
  closingAmount?: number;
  cashSales: number;
  cardSales: number;
  encashmentAmount: number;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
}

export type CashRegisterTransactionType = 'cash_in' | 'cash_out' | 'payment' | 'refund' | 'encashment';

export interface CashRegisterTransaction {
  id: string;
  cashRegisterId: string;
  type: CashRegisterTransactionType;
  amount: number;
  description?: string;
  performedById: string;
  createdAt: string;
}

// --- Insurance ---

export interface InsuranceCompany {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  contractNumber?: string;
  contractStart?: string;
  contractEnd?: string;
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
}

export type RegistryStatus = 'draft' | 'submitted' | 'accepted' | 'rejected' | 'paid';

export interface InsuranceRegistry {
  id: string;
  companyId: string;
  registryNumber: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  itemsCount: number;
  status: RegistryStatus;
  createdAt: string;
}

// --- Payroll ---

export type PayrollStatus = 'calculated' | 'approved' | 'paid';

export interface PayrollEntry {
  id: string;
  userId: string;
  year: number;
  month: number;
  baseSalary: number;
  serviceBonus: number;
  deductions: number;
  taxAmount: number;
  netAmount: number;
  servicesCount: number;
  servicesRevenue: number;
  bonusPercent: number;
  deductionReason?: string;
  status: PayrollStatus;
  user?: User;
  createdAt: string;
}

export interface PayrollSettings {
  id: string;
  userId: string;
  baseSalary: number;
  bonusPercent: number;
  taxRate: number;
  user?: User;
}

// --- Counterparty ---

export type CounterpartyType = 'supplier' | 'partner' | 'lab' | 'pharmacy' | 'other';

export interface Counterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  inn?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  bankName?: string;
  bankAccount?: string;
  isActive: boolean;
  createdAt: string;
}

// --- Inventory ---

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  minQuantity: number;
  reorderLevel?: number;
  unit: string;
  price: number;
  expirationDate?: string;
  manufacturer?: string;
  branchId?: string;
  createdAt: string;
}

export type MovementType = 'receipt' | 'consumption' | 'write_off' | 'transfer';

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  unitPrice?: number;
  performedById?: string;
  appointmentId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  notes?: string;
  createdAt: string;
}

// --- Analytics ---

export interface DashboardData {
  todayAppointments: number;
  monthRevenue: number;
  totalPatients: number;
  totalDoctors: number;
  // Reception-specific
  pendingConfirmation?: number;
  inQueue?: number;
  // Accountant-specific
  unpaidInvoices?: number;
  monthExpenses?: number;
}

// --- Marketing ---

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type CampaignChannel = 'sms' | 'email' | 'telegram' | 'push';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  targetAudience?: Record<string, unknown>;
  recipientsCount: number;
  deliveredCount: number;
  scheduledAt?: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  promoCode?: string;
  startDate: string;
  endDate: string;
  maxUses?: number;
  currentUses: number;
  serviceIds?: string[];
  isActive: boolean;
  createdAt: string;
}

// --- System ---

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  category?: string;
  description?: string;
  valueType: string;
}

export interface SystemLog {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
  createdAt: string;
}

// --- EMR Templates ---

export interface EmrTemplate {
  id: string;
  name: string;
  specialty: string;
  fields: { name: string; type: string; label: string; required: boolean; options?: string[] }[];
  createdBy: string;
  isDefault: boolean;
  createdAt: string;
}

// --- Chat ---

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  participantIds: string[];
  createdAt: string;
}

// --- Notification Settings ---

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  telegramEnabled: boolean;
  pushEnabled: boolean;
  appointmentNotifications: boolean;
  messageNotifications: boolean;
  taskNotifications: boolean;
  referralNotifications: boolean;
  systemNotifications: boolean;
  telegramChatId?: string;
}

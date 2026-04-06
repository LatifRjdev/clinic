import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ruRU from 'antd/locale/ru_RU';
import MainLayout from './components/layout/MainLayout';
import PublicLayout from './components/layout/PublicLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import PatientsPage from './features/patients/PatientsPage';
import SchedulingPage from './features/scheduling/SchedulingPage';
import EmrPage from './features/emr/EMRPage';
import BillingServicesPage from './features/billing/BillingServicesPage';
import InvoicesPage from './features/billing/InvoicesPage';
import ChatPage from './features/chat/ChatPage';
import TasksPage from './features/tasks/TasksPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import BranchesPage from './features/branches/BranchesPage';
import StaffPage from './features/staff/StaffPage';
import ExpensesPage from './features/expenses/ExpensesPage';
import PayrollPage from './features/payroll/PayrollPage';
import InsurancePage from './features/insurance/InsurancePage';
import CounterpartyPage from './features/counterparty/CounterpartyPage';
import ReportsPage from './features/reports/ReportsPage';
import InventoryPage from './features/inventory/InventoryPage';
import MarketingPage from './features/marketing/MarketingPage';
import SystemPage from './features/system/SystemPage';
import ProfilePage from './features/profile/ProfilePage';
import NotificationsPage from './features/notifications/NotificationsPage';
import AuditPage from './features/audit/AuditPage';
import DocumentsPage from './features/documents/DocumentsPage';
import CashRegisterPage from './features/billing/CashRegisterPage';
import CalendarPage from './features/scheduling/CalendarPage';
import DoctorSettingsPage from './features/scheduling/DoctorSettingsPage';
import DepartmentsPage from './features/staff/DepartmentsPage';
import PatientPortalPage from './features/patient-portal/PatientPortalPage';
import TelemedicinePage from './features/telemedicine/TelemedicinePage';
import ReportBuilderPage from './features/reports/ReportBuilderPage';

// Public pages
import HomePage from './features/public/HomePage';
import DoctorsPage from './features/public/DoctorsPage';
import DoctorProfilePage from './features/public/DoctorProfilePage';
import ServicesPage from './features/public/ServicesPage';
import BookingPage from './features/public/BookingPage';
import AboutPage from './features/public/AboutPage';
import ContactPage from './features/public/ContactPage';
import PatientRegisterPage from './features/public/PatientRegisterPage';
import PatientLoginPage from './features/public/PatientLoginPage';

import { useAuthStore } from './store/authStore';
import { publicService } from './api/services/public.service';
import { setRuntimeCurrency } from './utils/format';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Role-based route guard
const roleRouteAccess: Record<string, string[]> = {
  owner: ['*'],
  sysadmin: ['*'],
  chief_doctor: ['*'],
  admin: [
    '/', 'patients', 'scheduling', 'billing', 'insurance',
    'documents', 'chat', 'tasks', 'inventory', 'counterparty',
    'staff', 'branches', 'analytics', 'reports', 'profile', 'notifications',
  ],
  doctor: [
    '/', 'patients', 'scheduling', 'emr', 'telemedicine', 'documents', 'chat', 'tasks', 'profile', 'notifications',
  ],
  nurse: [
    '/', 'patients', 'scheduling', 'emr', 'documents', 'chat', 'tasks', 'inventory', 'profile', 'notifications',
  ],
  accountant: [
    '/', 'billing', 'insurance', 'documents', 'counterparty', 'reports', 'analytics', 'profile', 'notifications',
  ],
  reception: [
    '/', 'patients', 'scheduling', 'documents', 'chat', 'profile', 'notifications',
  ],
  patient: [
    '/', 'patient-portal', 'telemedicine', 'profile', 'notifications',
  ],
};

const RoleRoute: React.FC<{ section: string; children: React.ReactNode }> = ({ section, children }) => {
  const { user } = useAuthStore();
  const role = user?.role || 'doctor';
  const allowed = roleRouteAccess[role] || [];
  if (allowed.includes('*') || allowed.includes(section)) {
    return <>{children}</>;
  }
  return <Navigate to="/admin" replace />;
};

// Redirect patient role from dashboard to patient portal
const DashboardOrPortal: React.FC = () => {
  const { user } = useAuthStore();
  if (user?.role === 'patient') return <Navigate to="/admin/patient-portal" replace />;
  return <DashboardPage />;
};

const App: React.FC = () => {
  const { fetchProfile, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  // Bootstrap display currency from the system setting (public endpoint).
  useEffect(() => {
    publicService
      .getDefaultCurrency()
      .then((res) => setRuntimeCurrency(res?.currency))
      .catch(() => setRuntimeCurrency('TJS'));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={ruRU}
        theme={{
          token: {
            colorPrimary: '#3b82f6',
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b',
            colorError: '#ef4444',
            colorInfo: '#3b82f6',
            borderRadius: 10,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 14,
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f9fafb',
            controlHeight: 40,
            wireframe: false,
          },
          components: {
            Button: { primaryShadow: '0 2px 4px rgba(59, 130, 246, 0.2)', fontWeight: 500 },
            Card: { borderRadiusLG: 20, paddingLG: 24 },
            Table: { borderRadiusLG: 14, headerBg: '#f9fafb' },
            Input: { controlHeight: 42, borderRadius: 10 },
            Select: { controlHeight: 42, borderRadius: 10 },
            Modal: { borderRadiusLG: 20 },
            Menu: { itemBorderRadius: 10, itemMarginInline: 8 },
          },
        }}
      >
        <BrowserRouter>
          <Routes>
            {/* Public website */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorProfilePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/book/:doctorId" element={<BookingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/register" element={<PatientRegisterPage />} />
              <Route path="/patient-login" element={<PatientLoginPage />} />
            </Route>

            {/* Staff login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin panel (protected) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOrPortal />} />
              <Route path="patients" element={<RoleRoute section="patients"><PatientsPage /></RoleRoute>} />
              <Route path="scheduling/appointments" element={<RoleRoute section="scheduling"><SchedulingPage /></RoleRoute>} />
              <Route path="scheduling/calendar" element={<RoleRoute section="scheduling"><CalendarPage /></RoleRoute>} />
              <Route path="scheduling/doctor-settings" element={<RoleRoute section="scheduling"><DoctorSettingsPage /></RoleRoute>} />
              <Route path="emr" element={<RoleRoute section="emr"><EmrPage /></RoleRoute>} />
              <Route path="billing/services" element={<RoleRoute section="billing"><BillingServicesPage /></RoleRoute>} />
              <Route path="billing/invoices" element={<RoleRoute section="billing"><InvoicesPage /></RoleRoute>} />
              <Route path="billing/expenses" element={<RoleRoute section="billing"><ExpensesPage /></RoleRoute>} />
              <Route path="billing/payroll" element={<RoleRoute section="billing"><PayrollPage /></RoleRoute>} />
              <Route path="billing/cash-register" element={<RoleRoute section="billing"><CashRegisterPage /></RoleRoute>} />
              <Route path="documents" element={<RoleRoute section="documents"><DocumentsPage /></RoleRoute>} />
              <Route path="chat" element={<RoleRoute section="chat"><ChatPage /></RoleRoute>} />
              <Route path="tasks" element={<RoleRoute section="tasks"><TasksPage /></RoleRoute>} />
              <Route path="staff/profiles" element={<RoleRoute section="staff"><StaffPage /></RoleRoute>} />
              <Route path="staff/departments" element={<RoleRoute section="staff"><DepartmentsPage /></RoleRoute>} />
              <Route path="analytics" element={<RoleRoute section="analytics"><AnalyticsPage /></RoleRoute>} />
              <Route path="branches" element={<RoleRoute section="branches"><BranchesPage /></RoleRoute>} />
              <Route path="insurance" element={<RoleRoute section="insurance"><InsurancePage /></RoleRoute>} />
              <Route path="counterparty" element={<RoleRoute section="counterparty"><CounterpartyPage /></RoleRoute>} />
              <Route path="reports" element={<RoleRoute section="reports"><ReportsPage /></RoleRoute>} />
              <Route path="reports/builder" element={<RoleRoute section="reports"><ReportBuilderPage /></RoleRoute>} />
              <Route path="inventory" element={<RoleRoute section="inventory"><InventoryPage /></RoleRoute>} />
              <Route path="marketing" element={<RoleRoute section="marketing"><MarketingPage /></RoleRoute>} />
              <Route path="system" element={<RoleRoute section="system"><SystemPage /></RoleRoute>} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="audit" element={<RoleRoute section="audit"><AuditPage /></RoleRoute>} />
              <Route path="settings" element={<RoleRoute section="system"><SystemPage /></RoleRoute>} />
              <Route path="telemedicine" element={<RoleRoute section="telemedicine"><TelemedicinePage /></RoleRoute>} />
              <Route path="patient-portal" element={<RoleRoute section="patient-portal"><PatientPortalPage /></RoleRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;

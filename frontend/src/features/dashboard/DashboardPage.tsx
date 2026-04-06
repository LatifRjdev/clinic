import React from 'react';
import { Row, Col, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../../hooks';
import { useAuthStore } from '../../store/authStore';

import WelcomeBanner from './widgets/WelcomeBanner';
import StatCards from './widgets/StatCards';
import TodayAppointments from './widgets/TodayAppointments';
import RevenueChart from './widgets/RevenueChart';
import TasksWidget from './widgets/TasksWidget';
import ChatsWidget from './widgets/ChatsWidget';
import LowStockWidget from './widgets/LowStockWidget';
import DoctorLoadWidget from './widgets/DoctorLoadWidget';
import UnpaidInvoicesWidget from './widgets/UnpaidInvoicesWidget';
import StaffCardsWidget from './widgets/StaffCardsWidget';
import QueueWidget from './widgets/QueueWidget';
import RoomStatusWidget from './widgets/RoomStatusWidget';
import TodayStatsWidget from './widgets/TodayStatsWidget';

// ── Owner / Sysadmin Dashboard ──
const OwnerDashboard: React.FC = () => (
  <>
    <WelcomeBanner />
    <StatCards cards={['appointments', 'patients', 'revenue', 'doctors']} />
    <RevenueChart />
    <Row gutter={[20, 20]}>
      <Col xs={24} xl={16}>
        <TodayAppointments />
      </Col>
      <Col xs={24} xl={8}>
        <TasksWidget />
        <ChatsWidget />
      </Col>
    </Row>
    <StaffCardsWidget />
  </>
);

// ── Chief Doctor Dashboard ──
const ChiefDoctorDashboard: React.FC = () => (
  <>
    <WelcomeBanner />
    <StatCards cards={['appointments', 'patients', 'doctors']} />
    <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
      <Col xs={24} lg={16}>
        <TodayAppointments />
      </Col>
      <Col xs={24} lg={8}>
        <DoctorLoadWidget />
      </Col>
    </Row>
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={12}>
        <TasksWidget />
      </Col>
      <Col xs={24} lg={12}>
        <ChatsWidget />
      </Col>
    </Row>
    <StaffCardsWidget />
  </>
);

// ── Admin Dashboard ──
const AdminDashboard: React.FC = () => (
  <>
    <WelcomeBanner />
    <StatCards cards={['appointments', 'patients', 'revenue']} />
    <Row gutter={[20, 20]}>
      <Col xs={24} xl={16}>
        <TodayAppointments showActions />
      </Col>
      <Col xs={24} xl={8}>
        <TasksWidget />
        <ChatsWidget />
      </Col>
    </Row>
    <StaffCardsWidget />
  </>
);

// ── Reception Dashboard ──
const ReceptionDashboard: React.FC = () => (
  <>
    <WelcomeBanner />
    <StatCards cards={['appointments', 'patients']} />
    <TodayStatsWidget />
    <Row gutter={[20, 20]}>
      <Col xs={24} xl={16}>
        <TodayAppointments showActions />
      </Col>
      <Col xs={24} xl={8}>
        <QueueWidget />
        <RoomStatusWidget />
      </Col>
    </Row>
  </>
);

// ── Doctor Dashboard ──
const DoctorDashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <>
      <WelcomeBanner />
      <StatCards cards={['appointments']} />
      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <TodayAppointments
            compact
            doctorId={user?.id}
          />
        </Col>
        <Col xs={24} xl={8}>
          <TasksWidget onlyMine />
        </Col>
      </Row>
    </>
  );
};

// ── Nurse Dashboard ──
const NurseDashboard: React.FC = () => (
  <>
    <WelcomeBanner />
    <StatCards cards={['appointments', 'patients']} />
    <Row gutter={[20, 20]}>
      <Col xs={24} xl={16}>
        <TodayAppointments compact />
      </Col>
      <Col xs={24} xl={8}>
        <TasksWidget onlyMine />
        <LowStockWidget />
      </Col>
    </Row>
  </>
);

// ── Accountant Dashboard ──
const AccountantDashboard: React.FC = () => (
  <>
    <WelcomeBanner />
    <StatCards cards={['revenue', 'invoices']} />
    <RevenueChart />
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={12}>
        <UnpaidInvoicesWidget />
      </Col>
      <Col xs={24} lg={12}>
        <TasksWidget onlyMine />
      </Col>
    </Row>
  </>
);

// ── Role → Dashboard map ──
const dashboardByRole: Record<string, React.FC> = {
  owner: OwnerDashboard,
  sysadmin: OwnerDashboard,
  chief_doctor: ChiefDoctorDashboard,
  admin: AdminDashboard,
  reception: ReceptionDashboard,
  doctor: DoctorDashboard,
  nurse: NurseDashboard,
  accountant: AccountantDashboard,
};

const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'doctor';
  const { isLoading } = useDashboard(role);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const DashboardComponent = dashboardByRole[role] || OwnerDashboard;

  return (
    <div className="animate-fade-in-up">
      <DashboardComponent />
    </div>
  );
};

export default DashboardPage;

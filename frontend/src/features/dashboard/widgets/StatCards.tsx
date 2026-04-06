import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ContainerOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useDashboard } from '../../../hooks';
import { useAuthStore } from '../../../store/authStore';

const formatMoney = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

interface StatCard {
  icon: React.ReactNode;
  color: string;
  gradient?: string;
  value: string;
  label: string;
}

type CardPreset = 'appointments' | 'patients' | 'revenue' | 'doctors' | 'inventory' | 'invoices';

interface StatCardsProps {
  cards?: CardPreset[];
}

const StatCards: React.FC<StatCardsProps> = ({ cards }) => {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const { data: dashboard } = useDashboard(role);

  const presets: Record<CardPreset, StatCard> = {
    appointments: {
      icon: <CalendarOutlined />,
      color: 'blue',
      gradient: 'gradient-blue',
      value: String(dashboard?.todayAppointments ?? '—'),
      label: t('dashboard.todayAppointments'),
    },
    patients: {
      icon: <TeamOutlined />,
      color: 'green',
      value: dashboard?.totalPatients ? dashboard.totalPatients.toLocaleString('ru-RU') : '—',
      label: t('dashboard.totalPatients'),
    },
    revenue: {
      icon: <DollarOutlined />,
      color: 'amber',
      value: dashboard?.monthRevenue ? formatMoney(dashboard.monthRevenue) : '—',
      label: t('dashboard.monthRevenue'),
    },
    doctors: {
      icon: <ClockCircleOutlined />,
      color: 'red',
      value: String(dashboard?.totalDoctors ?? '—'),
      label: t('dashboard.doctorsOnShift'),
    },
    inventory: {
      icon: <ContainerOutlined />,
      color: 'purple',
      value: '—',
      label: t('inventory.lowStock'),
    },
    invoices: {
      icon: <FileTextOutlined />,
      color: 'amber',
      value: '—',
      label: t('dashboard.unpaidInvoices'),
    },
  };

  const selectedCards = cards || ['appointments', 'patients', 'revenue', 'doctors'];

  return (
    <Row gutter={[20, 20]} className="stagger-children" style={{ marginBottom: 28 }}>
      {selectedCards.map((key, index) => {
        const card = presets[key];
        if (!card) return null;
        return (
          <Col xs={24} sm={12} lg={24 / selectedCards.length >= 6 ? 6 : Math.floor(24 / selectedCards.length)} key={key}>
            <div className={`stat-card ${index === 0 ? card.gradient || '' : ''}`}>
              <div className={`stat-card-icon ${index === 0 ? '' : card.color}`}>{card.icon}</div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
};

export default StatCards;

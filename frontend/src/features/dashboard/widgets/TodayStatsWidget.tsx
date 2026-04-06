import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col } from 'antd';
import {
  UserAddOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { appointmentsService } from '../../../api/services/scheduling.service';
import { invoicesService } from '../../../api/services/billing.service';
import type { Appointment, Invoice } from '../../../types';

const TodayStatsWidget: React.FC = () => {
  const { t } = useTranslation();

  const { data: todayAppointments } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentsService.findToday(),
    refetchInterval: 30000,
  });

  const { data: pendingInvoices } = useQuery({
    queryKey: ['invoices', 'pending'],
    queryFn: () => invoicesService.findAll({ status: 'pending', limit: 100 }),
    refetchInterval: 30000,
  });

  const registeredCount = todayAppointments?.length ?? 0;
  const completedCount =
    todayAppointments?.filter((a) => a.status === 'completed').length ?? 0;

  const pendingList: Invoice[] = Array.isArray(pendingInvoices)
    ? pendingInvoices
    : (pendingInvoices as any)?.data || [];
  const pendingCount = Array.isArray(pendingInvoices)
    ? pendingList.length
    : (pendingInvoices as any)?.total ?? pendingList.length;

  const cells: Array<{
    icon: React.ReactNode;
    color: string;
    value: number;
    label: string;
  }> = [
    {
      icon: <UserAddOutlined />,
      color: '#3b82f6',
      value: registeredCount,
      label: t('dashboard.todayRegistered'),
    },
    {
      icon: <CheckCircleOutlined />,
      color: '#10b981',
      value: completedCount,
      label: t('dashboard.todayCompleted'),
    },
    {
      icon: <DollarOutlined />,
      color: '#f59e0b',
      value: pendingCount,
      label: t('dashboard.todayPending'),
    },
  ];

  return (
    <div className="modern-card" style={{ marginBottom: 20 }}>
      <div className="modern-card-header">
        <h3>{t('dashboard.todayStatsTitle')}</h3>
      </div>
      <div className="modern-card-body">
        <Row gutter={[12, 12]}>
          {cells.map((c, i) => (
            <Col xs={24} sm={8} key={i}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--gray-50, #f9fafb)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${c.color}1A`,
                    color: c.color,
                    fontSize: 18,
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>
                    {c.value}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--gray-500, #6b7280)',
                      marginTop: 2,
                    }}
                  >
                    {c.label}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default TodayStatsWidget;

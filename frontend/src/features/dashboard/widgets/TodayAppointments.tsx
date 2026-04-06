import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Avatar, Button, Space, Tooltip, message } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, UserSwitchOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTodayAppointments, useChangeAppointmentStatus } from '../../../hooks';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { Appointment } from '../../../types';

const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];

interface TodayAppointmentsProps {
  showActions?: boolean;
  compact?: boolean;
  title?: string;
  doctorId?: string;
}

const TodayAppointments: React.FC<TodayAppointmentsProps> = ({
  showActions = false,
  compact = false,
  title,
  doctorId,
}) => {
  const { t } = useTranslation();
  const { data: todayAppts, isLoading } = useTodayAppointments();
  const changeStatus = useChangeAppointmentStatus();
  const navigate = useNavigate();

  const displayTitle = title ?? t('dashboard.todayAppointments');

  const filteredAppts = doctorId
    ? (todayAppts || []).filter((a: Appointment) => a.doctorId === doctorId)
    : todayAppts || [];

  const handleStatusChange = (id: string, status: string) => {
    changeStatus.mutate({ id, status }, {
      onSuccess: () => message.success(t('dashboard.statusUpdated')),
      onError: () => message.error(t('dashboard.statusUpdateError')),
    });
  };

  const columns = [
    {
      title: t('scheduling.time'),
      dataIndex: 'startTime',
      key: 'startTime',
      width: 80,
      render: (time: string) => (
        <span style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: 15 }}>{time?.slice(0, 5)}</span>
      ),
    },
    {
      title: t('scheduling.patient'),
      key: 'patient',
      render: (_: unknown, record: Appointment, index: number) => {
        const name = record.patient
          ? `${record.patient.lastName} ${record.patient.firstName}`
          : record.patientId;
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => navigate(`/patients?highlight=${record.patientId}`)}
          >
            <Avatar
              size={36}
              style={{
                background: `linear-gradient(135deg, ${avatarColors[index % 5]}, ${avatarColors[(index + 2) % 5]})`,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {String(name).charAt(0)}
            </Avatar>
            <span style={{ fontWeight: 600, color: 'var(--primary-500)' }}>{name}</span>
          </div>
        );
      },
    },
    ...(!compact ? [{
      title: t('scheduling.doctor'),
      key: 'doctor',
      render: (_: unknown, record: Appointment) => {
        const doc = record.doctor
          ? `${record.doctor.lastName} ${record.doctor.firstName?.charAt(0)}.`
          : '';
        return <span style={{ color: 'var(--gray-600)' }}>{doc}</span>;
      },
    }] : []),
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        const statusKeyMap: Record<string, string> = {
          scheduled: 'scheduling.scheduled',
          waiting_confirmation: 'scheduling.waitingConfirmation',
          confirmed: 'scheduling.confirmed',
          in_progress: 'scheduling.inProgress',
          completed: 'scheduling.completed',
          cancelled: 'scheduling.cancelled',
          no_show: 'scheduling.noShow',
        };
        const cssClass = status === 'in_progress' ? 'in-progress' : status;
        return <span className={`status-badge ${cssClass}`}>{t(statusKeyMap[status] || status)}</span>;
      },
    },
    ...(showActions ? [{
      title: t('common.actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Appointment) => (
        <Space size={4}>
          {['scheduled', 'waiting_confirmation'].includes(record.status) && (
            <Tooltip title={t('scheduling.confirm')}>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, 'confirmed')}
              />
            </Tooltip>
          )}
          {record.status === 'confirmed' && (
            <Tooltip title={t('scheduling.arrived')}>
              <Button
                size="small"
                style={{ background: '#10b981', color: 'white', border: 'none' }}
                icon={<UserSwitchOutlined />}
                onClick={() => handleStatusChange(record.id, 'in_progress')}
              />
            </Tooltip>
          )}
          {(record.status === 'in_progress' || record.status === 'confirmed') && (
            <Tooltip title={t('scheduling.startExam')}>
              <Button
                size="small"
                style={{ background: '#8b5cf6', color: 'white', border: 'none' }}
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/emr?appointmentId=${record.id}&patientId=${record.patientId}`)}
              />
            </Tooltip>
          )}
          {record.status === 'in_progress' && (
            <Tooltip title={t('scheduling.complete')}>
              <Button
                size="small"
                style={{ background: '#059669', color: 'white', border: 'none' }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'completed')}
              />
            </Tooltip>
          )}
          {['scheduled', 'confirmed'].includes(record.status) && (
            <Tooltip title={t('scheduling.cancel')}>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleStatusChange(record.id, 'cancelled')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    }] : []),
  ];

  return (
    <div className="modern-card">
      <div className="modern-card-header">
        <h3>{displayTitle}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>
            {filteredAppts.length} {t('dashboard.entries')}
          </span>
          {showActions && (
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                background: 'var(--primary-500)', color: 'white',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
              onClick={() => navigate('/scheduling/appointments')}
            >
              <PlusOutlined style={{ fontSize: 11 }} /> {t('dashboard.newEntry')}
            </span>
          )}
        </div>
      </div>
      <div className="modern-card-body" style={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredAppts.map((a: Appointment) => ({ ...a, key: a.id }))}
          pagination={false}
          size="middle"
          loading={isLoading}
          locale={{ emptyText: t('dashboard.noEntriesToday') }}
        />
      </div>
    </div>
  );
};

export default TodayAppointments;

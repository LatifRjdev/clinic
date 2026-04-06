import React, { useState } from 'react';
import { Table, Button, Tag, Segmented, Empty } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications';
import type { Notification } from '../../types';

const typeColors: Record<string, string> = {
  appointment: 'blue',
  message: 'green',
  task: 'orange',
  referral: 'purple',
  system: 'red',
};

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const isRead = filter === 'read' ? true : filter === 'unread' ? false : undefined;
  const { data, isLoading } = useNotifications({ isRead, page, limit: 30 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data || [];
  const total = data?.total || 0;

  const typeLabels: Record<string, string> = {
    appointment: t('notifications.typeAppointment'),
    message: t('notifications.typeMessage'),
    task: t('notifications.typeTask'),
    referral: t('notifications.typeReferral'),
    system: t('notifications.typeSystem'),
  };

  const columns = [
    {
      title: t('notifications.type'), dataIndex: 'type', key: 'type', width: 110,
      render: (tp: string) => { const label = typeLabels[tp] || tp; const color = typeColors[tp] || 'default'; return <Tag color={color}>{label}</Tag>; },
    },
    {
      title: t('notifications.notification'), key: 'content',
      render: (_: unknown, r: Notification) => (
        <div>
          <div style={{ fontWeight: r.isRead ? 400 : 600, color: r.isRead ? 'var(--gray-500)' : 'var(--gray-900)' }}>{r.title}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{r.body}</div>
        </div>
      ),
    },
    {
      title: t('notifications.time'), dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (d: string) => <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(d).toLocaleString('ru-RU')}</span>,
    },
    {
      title: '', key: 'actions', width: 80,
      render: (_: unknown, r: Notification) => !r.isRead ? (
        <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => markRead.mutate(r.id)} style={{ color: 'var(--primary-500)' }}>
          {t('notifications.markRead')}
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><BellOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('notifications.title')}</h2>
        <Button onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>{t('notifications.readAll')}</Button>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Segmented
            value={filter}
            onChange={(v) => { setFilter(v as string); setPage(1); }}
            options={[
              { value: 'all', label: t('notifications.all') },
              { value: 'unread', label: t('notifications.unread') },
              { value: 'read', label: t('notifications.read') },
            ]}
            style={{ marginBottom: 16 }}
          />
          <Table columns={columns} dataSource={notifications} rowKey="id" loading={isLoading}
            pagination={{ current: page, pageSize: 30, total, onChange: (p) => setPage(p) }}
            size="middle" scroll={{ x: 700 }} locale={{ emptyText: <Empty description={t('common.noNotifications')} /> }} />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

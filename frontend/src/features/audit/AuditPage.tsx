import React, { useState } from 'react';
import { Table, Select, DatePicker, Tag, Space, Empty } from 'antd';
import { AuditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../../api/services/audit.service';

const actionColors: Record<string, string> = {
  create: 'green', update: 'blue', delete: 'red', login: 'cyan',
  logout: 'default', view: 'default', sign: 'purple', approve: 'orange',
};

const AuditPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string | undefined>();
  const [entityType, setEntityType] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { action, entityType, dateFrom, dateTo, page }],
    queryFn: () => auditService.findAll({ action, entityType, dateFrom, dateTo, page, limit: 50 }),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;

  const columns = [
    {
      title: t('audit.time'), dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (d: string) => <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(d).toLocaleString('ru-RU')}</span>,
    },
    {
      title: t('audit.action'), dataIndex: 'action', key: 'action', width: 120,
      render: (a: string) => <Tag color={actionColors[a] || 'default'}>{a}</Tag>,
    },
    { title: t('audit.entityType'), dataIndex: 'entityType', key: 'entityType', width: 140 },
    {
      title: t('audit.entityId'), dataIndex: 'entityId', key: 'entityId', width: 280,
      render: (v: string) => v ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gray-400)' }}>{v}</span> : '—',
    },
    {
      title: t('audit.details'), dataIndex: 'details', key: 'details',
      render: (d: Record<string, unknown>) => d ? <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{JSON.stringify(d).slice(0, 100)}</span> : '—',
    },
    {
      title: 'IP', dataIndex: 'ipAddress', key: 'ipAddress', width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v || '—'}</span>,
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><AuditOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('audit.title')}</h2>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Space wrap style={{ marginBottom: 16 }}>
            <Select placeholder={t('audit.action')} allowClear style={{ minWidth: 140 }} value={action} onChange={(v) => { setAction(v); setPage(1); }}
              options={['create', 'update', 'delete', 'login', 'logout', 'view', 'sign', 'approve'].map((a) => ({ value: a, label: a }))} />
            <Select placeholder={t('audit.entityType')} allowClear style={{ minWidth: 140 }} value={entityType} onChange={(v) => { setEntityType(v); setPage(1); }}
              options={['patient', 'appointment', 'medical_record', 'invoice', 'user', 'document'].map((t) => ({ value: t, label: t }))} />
            <DatePicker placeholder={t('audit.dateFrom')} onChange={(d) => { setDateFrom(d ? d.format('YYYY-MM-DD') : undefined); setPage(1); }} />
            <DatePicker placeholder={t('audit.dateTo')} onChange={(d) => { setDateTo(d ? d.format('YYYY-MM-DD') : undefined); setPage(1); }} />
          </Space>
          <Table columns={columns} dataSource={logs} rowKey="id" loading={isLoading}
            pagination={{ current: page, pageSize: 50, total, onChange: (p) => setPage(p) }}
            size="small" scroll={{ x: 900 }} locale={{ emptyText: <Empty description={t('audit.noRecords')} /> }} />
        </div>
      </div>
    </div>
  );
};

export default AuditPage;

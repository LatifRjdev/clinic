import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Row, Col, Tag, Space, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { counterpartyService } from '../../api/services/counterparty.service';
import { useTranslation } from 'react-i18next';
import type { Counterparty } from '../../types';

const typeColors: Record<string, string> = {
  supplier: 'blue', partner: 'green', lab: 'purple', pharmacy: 'orange', other: 'default',
};

const CounterpartyPage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Counterparty | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const typeLabels: Record<string, string> = {
    supplier: t('counterparty.typeSupplier'), partner: t('counterparty.typePartner'),
    lab: t('counterparty.typeLab'), pharmacy: t('counterparty.typePharmacy'), other: t('counterparty.typeOther'),
  };

  const { data, isLoading } = useQuery({ queryKey: ['counterparties', search, typeFilter], queryFn: () => counterpartyService.findAll({ search: search || undefined, type: typeFilter }) });
  const createMut = useMutation({ mutationFn: (d: Partial<Counterparty>) => counterpartyService.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['counterparties'] }); message.success(t('counterparty.added')); } });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<Counterparty> }) => counterpartyService.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['counterparties'] }); message.success(t('counterparty.updated')); } });

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (editing) await updateMut.mutateAsync({ id: editing.id, d: values });
    else await createMut.mutateAsync(values);
    setIsModalOpen(false); setEditing(null); form.resetFields();
  };

  const items = (data as { data: Counterparty[] })?.data || (data as Counterparty[]) || [];

  const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({ value, label }));

  const columns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: t('counterparty.type'), dataIndex: 'type', key: 'type', width: 130, render: (tp: string) => { const label = typeLabels[tp] || tp; const color = typeColors[tp] || 'default'; return <Tag color={color}>{label}</Tag>; } },
    { title: t('counterparty.inn'), dataIndex: 'inn', key: 'inn', width: 130, render: (v: string) => v || '—' },
    { title: t('counterparty.contactPerson'), dataIndex: 'contactPerson', key: 'contactPerson', render: (v: string) => v || '—' },
    { title: t('patients.phone'), dataIndex: 'phone', key: 'phone', width: 140, render: (v: string) => v || '—' },
    { title: t('common.status'), dataIndex: 'isActive', key: 'isActive', width: 100, render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('counterparty.active') : t('counterparty.inactive')}</Tag> },
    { title: '', key: 'actions', width: 50, render: (_: unknown, r: Counterparty) => (
      <Button type="text" icon={<EditOutlined />} size="small" onClick={() => { setEditing(r); form.setFieldsValue(r); setIsModalOpen(true); }} />
    )},
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><TeamOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.counterparties')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setIsModalOpen(true); }}>{t('counterparty.add')}</Button>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col flex="auto"><Input placeholder={t('common.searchPlaceholder')} prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ maxWidth: 300 }} /></Col>
            <Col><Select placeholder={t('counterparty.type')} allowClear style={{ minWidth: 140 }} value={typeFilter} onChange={setTypeFilter}
              options={typeOptions} /></Col>
          </Row>
          <Table columns={columns} dataSource={items} rowKey="id" loading={isLoading} pagination={{ pageSize: 20 }} size="middle" scroll={{ x: 800 }} />
        </div>
      </div>
      <Modal title={editing ? t('common.edit') : t('counterparty.new')} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()} okText={t('common.save')} cancelText={t('common.cancel')} width={560}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={16}><Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="type" label={t('counterparty.type')} rules={[{ required: true }]}>
              <Select options={typeOptions} />
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}><Form.Item name="inn" label={t('counterparty.inn')}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="phone" label={t('patients.phone')}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="contactPerson" label={t('counterparty.contactPerson')}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="bankName" label={t('counterparty.bankName')}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="bankAccount" label={t('counterparty.bankAccount')}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label={t('patients.address')}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CounterpartyPage;

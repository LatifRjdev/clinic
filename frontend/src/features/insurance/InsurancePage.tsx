import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Row, Col, Tag, Tabs, message } from 'antd';
import { PlusOutlined, EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insuranceService } from '../../api/services/insurance.service';
import type { InsuranceCompany, InsuranceRegistry } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const registryStatusColors: Record<string, string> = {
  draft: 'default', submitted: 'blue', accepted: 'green', rejected: 'red', paid: 'gold',
};

const InsurancePage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<InsuranceCompany | null>(null);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data: companies, isLoading } = useQuery({ queryKey: ['insurance', 'companies'], queryFn: () => insuranceService.findAllCompanies() });
  const { data: registries } = useQuery({ queryKey: ['insurance', 'registries'], queryFn: () => insuranceService.findAllRegistries() });

  const createMut = useMutation({
    mutationFn: (data: Partial<InsuranceCompany>) => insuranceService.createCompany(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['insurance'] }); message.success(t('insurance.companyAdded')); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsuranceCompany> }) => insuranceService.updateCompany(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['insurance'] }); message.success(t('insurance.updated')); },
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      contractStart: values.contractStart ? (values.contractStart as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      contractEnd: values.contractEnd ? (values.contractEnd as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
    };
    if (editing) await updateMut.mutateAsync({ id: editing.id, data: payload });
    else await createMut.mutateAsync(payload);
    setIsModalOpen(false); setEditing(null); form.resetFields();
  };

  const registryStatusLabels: Record<string, string> = {
    draft: t('insurance.statusDraft'), submitted: t('insurance.statusSubmitted'),
    accepted: t('insurance.statusAccepted'), rejected: t('insurance.statusRejected'), paid: t('insurance.statusPaid'),
  };

  const companyColumns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: t('billing.code'), dataIndex: 'code', key: 'code', width: 100 },
    { title: t('insurance.contactPerson'), dataIndex: 'contactPerson', key: 'contactPerson', render: (v: string) => v || '—' },
    { title: t('insurance.discount'), dataIndex: 'discountPercent', key: 'discountPercent', width: 90, render: (v: number) => `${v}%` },
    { title: t('common.status'), dataIndex: 'isActive', key: 'isActive', width: 100, render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('insurance.active') : t('insurance.inactive')}</Tag> },
    { title: '', key: 'actions', width: 50, render: (_: unknown, r: InsuranceCompany) => (
      <Button type="text" icon={<EditOutlined />} size="small" onClick={() => { setEditing(r); form.setFieldsValue(r); setIsModalOpen(true); }} />
    )},
  ];

  const registryColumns = [
    { title: '№', dataIndex: 'registryNumber', key: 'registryNumber', render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span> },
    { title: t('insurance.period'), key: 'period', render: (_: unknown, r: InsuranceRegistry) => `${r.periodStart} — ${r.periodEnd}` },
    { title: t('billing.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => formatCurrency(v || 0) },
    { title: t('insurance.itemsCount'), dataIndex: 'itemsCount', key: 'itemsCount', width: 90 },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 120, render: (s: string) => { const label = registryStatusLabels[s] || s; const color = registryStatusColors[s] || 'default'; return <Tag color={color}>{label}</Tag>; } },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><SafetyCertificateOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('insurance.title')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setIsModalOpen(true); }}>{t('insurance.addCompany')}</Button>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Tabs items={[
            { key: 'companies', label: t('insurance.companies'), children: <Table columns={companyColumns} dataSource={companies || []} rowKey="id" loading={isLoading} pagination={false} size="middle" scroll={{ x: 700 }} /> },
            { key: 'registries', label: t('insurance.registries'), children: <Table columns={registryColumns} dataSource={(registries as { data: InsuranceRegistry[] })?.data || []} rowKey="id" pagination={false} size="middle" scroll={{ x: 700 }} /> },
          ]} />
        </div>
      </div>
      <Modal title={editing ? t('common.edit') : t('insurance.newInsurance')} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()} okText={t('common.save')} cancelText={t('common.cancel')} width={560}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={16}><Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="code" label={t('billing.code')} rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="phone" label={t('patients.phone')}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="contactPerson" label={t('insurance.contactPerson')}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}><Form.Item name="discountPercent" label={t('insurance.discountPercent')} initialValue={0}><InputNumber style={{ width: '100%' }} min={0} max={100} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="contractStart" label={t('insurance.contractStart')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="contractEnd" label={t('insurance.contractEnd')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default InsurancePage;

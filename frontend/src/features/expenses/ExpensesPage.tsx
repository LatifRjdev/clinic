import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, Tag, Space, Tooltip, message } from 'antd';
import { PlusOutlined, CheckOutlined, WalletOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useExpenses, useCreateExpense, useApproveExpense } from '../../hooks/useBilling';
import { formatCurrency } from '../../utils/format';
import type { Expense } from '../../types';

const ExpensesPage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [form] = Form.useForm();

  const { data, isLoading } = useExpenses({ category: categoryFilter, page, limit: 20 });
  const createExpense = useCreateExpense();
  const approveExpense = useApproveExpense();

  const expenses = data?.data || [];
  const total = data?.total || 0;

  const categoryLabels: Record<string, string> = {
    rent: t('expenses.rent'),
    utilities: t('expenses.utilities'),
    salary: t('expenses.salary'),
    supplies: t('expenses.supplies'),
    equipment: t('expenses.equipment'),
    marketing: t('expenses.marketing'),
    other: t('expenses.other'),
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      const expenseDate = values.expenseDate
        ? (values.expenseDate as { format: (f: string) => string }).format('YYYY-MM-DD') : undefined;
      await createExpense.mutateAsync({ ...values, expenseDate } as Partial<Expense>);
      message.success(t('expenses.expenseAdded'));
      setIsModalOpen(false);
      form.resetFields();
    } catch { message.error(t('common.error')); }
  };

  const columns = [
    { title: t('expenses.description'), dataIndex: 'description', key: 'description', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      title: t('billing.category'), dataIndex: 'category', key: 'category', width: 140,
      render: (c: string) => <Tag>{categoryLabels[c] || c}</Tag>,
    },
    {
      title: t('billing.totalAmount'), dataIndex: 'amount', key: 'amount', width: 160,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatCurrency(v || 0)}</span>,
    },
    {
      title: t('common.date'), dataIndex: 'expenseDate', key: 'expenseDate', width: 120,
      render: (d: string) => d ? new Date(d).toLocaleDateString('ru-RU') : '—',
    },
    { title: t('expenses.paidTo'), dataIndex: 'paidTo', key: 'paidTo', width: 150, render: (v: string) => v || '—' },
    {
      title: t('common.status'), dataIndex: 'isApproved', key: 'isApproved', width: 120,
      render: (v: boolean) => <Tag color={v ? 'green' : 'orange'}>{v ? t('expenses.approved') : t('expenses.pending')}</Tag>,
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: unknown, record: Expense) => !record.isApproved ? (
        <Tooltip title={t('expenses.approve')}>
          <Button type="text" icon={<CheckOutlined />} size="small" style={{ color: 'var(--accent-500)' }}
            onClick={async () => { await approveExpense.mutateAsync(record.id); message.success(t('expenses.approved')); }} />
        </Tooltip>
      ) : null,
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><WalletOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.expenses')}</h2>
        <Space>
          <Select placeholder={t('billing.category')} allowClear style={{ minWidth: 140 }} value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>{t('expenses.addExpense')}</Button>
        </Space>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Table columns={columns} dataSource={expenses} rowKey="id" loading={isLoading}
            pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p) }} size="middle" scroll={{ x: 800 }} />
        </div>
      </div>
      <Modal title={t('expenses.newExpense')} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()}
        confirmLoading={createExpense.isPending} okText={t('common.save')} cancelText={t('common.cancel')} width={520}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="description" label={t('expenses.description')} rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="category" label={t('billing.category')} rules={[{ required: true }]}>
              <Select options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="amount" label={t('billing.totalAmount')} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="expenseDate" label={t('common.date')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="paidTo" label={t('expenses.paidTo')}><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;

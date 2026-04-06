import React, { useState, useMemo } from 'react';
import { Table, Button, Select, Tag, Space, InputNumber, Modal, Form, Input, message, Descriptions } from 'antd';
import { DollarOutlined, CalculatorOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../api/services/payroll.service';
import { formatCurrency, getCurrencySymbol } from '../../utils/format';
import type { PayrollEntry } from '../../types';

const statusColors: Record<string, string> = {
  calculated: 'blue',
  approved: 'green',
  paid: 'gold',
};

interface EditFormValues {
  serviceBonus: number;
  deductions: number;
  deductionReason: string;
}

const PayrollPage: React.FC = () => {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form] = Form.useForm<EditFormValues>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', year, month],
    queryFn: () => payrollService.findAll({ year, month }),
  });

  const calculateMut = useMutation({
    mutationFn: (employeeId: string | void) => payrollService.calculate((employeeId as string) || '', year, month),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll'] }); message.success(t('payroll.calculated')); },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => payrollService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });

  const paidMut = useMutation({
    mutationFn: (id: string) => payrollService.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { serviceBonus?: number; deductions?: number; deductionReason?: string } }) =>
      payrollService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      message.success(t('payroll.updated'));
      setEditModalOpen(false);
      setEditingEntry(null);
    },
  });

  const entries = data?.data || [];
  const fmt = (v: number) => v?.toLocaleString('ru-RU') || '0';

  const statusLabels: Record<string, string> = {
    calculated: t('payroll.statusCalculated'),
    approved: t('payroll.statusApproved'),
    paid: t('payroll.statusPaid'),
  };

  const monthNames = [
    t('payroll.january'), t('payroll.february'), t('payroll.march'),
    t('payroll.april'), t('payroll.may'), t('payroll.june'),
    t('payroll.july'), t('payroll.august'), t('payroll.september'),
    t('payroll.october'), t('payroll.november'), t('payroll.december'),
  ];

  // Watch form values for real-time net calculation
  const serviceBonusValue = Form.useWatch('serviceBonus', form);
  const deductionsValue = Form.useWatch('deductions', form);

  const calculatedNet = useMemo(() => {
    if (!editingEntry) return 0;
    const base = Number(editingEntry.baseSalary) || 0;
    const bonus = Number(serviceBonusValue) || 0;
    const ded = Number(deductionsValue) || 0;
    const taxRate = editingEntry.bonusPercent !== undefined
      ? (Number(editingEntry.taxAmount) / (base + Number(editingEntry.serviceBonus)) * 100) || 13
      : 13;
    const gross = base + bonus;
    const tax = gross * (taxRate / 100);
    return gross - tax - ded;
  }, [editingEntry, serviceBonusValue, deductionsValue]);

  const openEditModal = (entry: PayrollEntry) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      serviceBonus: entry.serviceBonus || 0,
      deductions: entry.deductions || 0,
      deductionReason: entry.deductionReason || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    form.validateFields().then((values) => {
      if (!editingEntry) return;
      updateMut.mutate({
        id: editingEntry.id,
        data: {
          serviceBonus: values.serviceBonus,
          deductions: values.deductions,
          deductionReason: values.deductionReason || undefined,
        },
      });
    });
  };

  const columns = [
    {
      title: t('staff.employee'), key: 'user',
      render: (_: unknown, r: PayrollEntry) => (
        <span style={{ fontWeight: 600 }}>{r.user ? `${r.user.lastName} ${r.user.firstName}` : r.userId?.slice(0, 8)}</span>
      ),
    },
    { title: t('payroll.baseSalary'), dataIndex: 'baseSalary', key: 'baseSalary', width: 120, render: (v: number) => fmt(v) },
    { title: t('payroll.bonus'), dataIndex: 'serviceBonus', key: 'serviceBonus', width: 120, render: (v: number) => <span style={{ color: 'var(--accent-600)' }}>{fmt(v)}</span> },
    { title: t('payroll.deductions'), dataIndex: 'deductions', key: 'deductions', width: 110, render: (v: number) => v > 0 ? <span style={{ color: 'var(--danger-500)' }}>-{fmt(v)}</span> : '0' },
    { title: t('payroll.tax'), dataIndex: 'taxAmount', key: 'taxAmount', width: 100, render: (v: number) => fmt(v) },
    { title: t('payroll.netAmount'), dataIndex: 'netAmount', key: 'netAmount', width: 140, render: (v: number) => <span style={{ fontWeight: 700 }}>{formatCurrency(v)}</span> },
    {
      title: t('common.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (s: string) => { const color = statusColors[s] || 'default'; const label = statusLabels[s] || s; return <Tag color={color}>{label}</Tag>; },
    },
    {
      title: '', key: 'actions', width: 160,
      render: (_: unknown, r: PayrollEntry) => (
        <Space size={4}>
          {r.status === 'calculated' && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)}>
              {t('payroll.edit')}
            </Button>
          )}
          {r.status === 'calculated' && <Button size="small" onClick={() => approveMut.mutate(r.id)}>{t('payroll.approve')}</Button>}
          {r.status === 'approved' && <Button size="small" type="primary" onClick={() => paidMut.mutate(r.id)}>{t('payroll.pay')}</Button>}
        </Space>
      ),
    },
  ];

  const employeeName = editingEntry?.user
    ? `${editingEntry.user.lastName} ${editingEntry.user.firstName}`
    : editingEntry?.userId?.slice(0, 8) || '';

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><DollarOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.payroll')}</h2>
        <Space>
          <Select value={month} onChange={setMonth} style={{ minWidth: 140 }}
            options={monthNames.map((m, i) => ({ value: i + 1, label: m }))} />
          <Select value={year} onChange={setYear} style={{ minWidth: 100 }}
            options={[2024, 2025, 2026].map((y) => ({ value: y, label: String(y) }))} />
          <Button type="primary" icon={<CalculatorOutlined />} onClick={() => calculateMut.mutate()}
            loading={calculateMut.isPending}>
            {t('payroll.calculate')}
          </Button>
        </Space>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Table columns={columns} dataSource={entries} rowKey="id" loading={isLoading} pagination={false} size="middle"
            scroll={{ x: 900 }} locale={{ emptyText: t('payroll.noDataCalculate') }} />
        </div>
      </div>

      <Modal
        title={t('payroll.editEntry')}
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingEntry(null); }}
        onOk={handleEditSubmit}
        okText={t('payroll.save')}
        cancelText={t('common.cancel')}
        confirmLoading={updateMut.isPending}
        destroyOnClose
      >
        <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label={t('payroll.employee')}>
            <strong>{employeeName}</strong>
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll.baseSalary')}>
            {formatCurrency(editingEntry?.baseSalary || 0)}
          </Descriptions.Item>
        </Descriptions>

        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="serviceBonus"
            label={t('payroll.serviceBonus')}
            rules={[{ required: true }, { type: 'number', min: 0 }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonAfter={getCurrencySymbol()}
            />
          </Form.Item>

          <Form.Item
            name="deductions"
            label={t('payroll.deductions')}
            rules={[{ required: true }, { type: 'number', min: 0 }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonAfter={getCurrencySymbol()}
            />
          </Form.Item>

          <Form.Item
            name="deductionReason"
            label={t('payroll.deductionReason')}
          >
            <Input placeholder={t('payroll.deductionReasonPlaceholder')} />
          </Form.Item>
        </Form>

        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-secondary, #f5f5f5)',
          borderRadius: 8,
          textAlign: 'right',
          fontSize: 16,
        }}>
          <span>{t('payroll.calculatedNet')}: </span>
          <strong style={{ fontSize: 18 }}>
            {formatCurrency(Math.round(calculatedNet * 100) / 100)}
          </strong>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollPage;

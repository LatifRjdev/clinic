import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Avatar,
  Tooltip,
  message,
  Divider,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
  DollarOutlined,
  DeleteOutlined,
  WalletOutlined,
  CreditCardOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useInvoices, useCreateInvoice, useRefundInvoice, useServices } from '../../hooks/useBilling';
import { usePatientSearch } from '../../hooks/usePatients';
import apiClient from '../../api/client';
import { formatCurrency, getCurrencySymbol } from '../../utils/format';
import type { Invoice } from '../../types';

const statusClassMapInv: Record<string, string> = {
  draft: 'completed',
  pending: 'in-progress',
  paid: 'confirmed',
  partially_paid: 'scheduled',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

const printInvoice = async (record: Invoice) => {
  try {
    const response = await apiClient.get(`/pdf/invoice/${record.id}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    message.error('Failed to generate PDF');
  }
};

const InvoicesPage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | undefined>(undefined);
  const [patientSearch, setPatientSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form] = Form.useForm();

  const [invoiceItems, setInvoiceItems] = useState<{serviceId: string; quantity: number; unitPrice: number}[]>([]);

  const { data: invoicesData, isLoading } = useInvoices({ status: statusFilter, page, limit: 20 });
  const { data: searchedPatients } = usePatientSearch(patientSearch);
  const { data: servicesData } = useServices({ limit: 200 });
  const createInvoice = useCreateInvoice();
  const refundInvoice = useRefundInvoice();

  const servicesList = servicesData?.data || [];
  const invoices = invoicesData?.data || [];
  const total = invoicesData?.total || 0;

  const subtotal = useMemo(() => invoiceItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [invoiceItems]);
  const discountValue = Form.useWatch('discount', form) || 0;
  const finalAmount = Math.max(subtotal - discountValue, 0);

  const formatPrice = (p: number) => formatCurrency(p);

  const invoiceStatusLabels: Record<string, string> = {
    draft: t('billing.draft'),
    pending: t('billing.pending'),
    paid: t('billing.paid'),
    partially_paid: t('billing.partiallyPaid'),
    cancelled: t('scheduling.cancelled'),
    refunded: t('billing.refunded'),
  };

  const paymentMethodOptions = [
    { value: 'cash', label: t('billing.cash'), icon: <WalletOutlined />, color: 'green' },
    { value: 'card', label: t('billing.card'), icon: <CreditCardOutlined />, color: 'blue' },
    { value: 'transfer', label: t('billing.transfer'), icon: <BankOutlined />, color: 'purple' },
    { value: 'insurance', label: t('billing.insurance'), icon: <SafetyCertificateOutlined />, color: 'orange' },
  ];

  const paymentMethodMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {};
  paymentMethodOptions.forEach((opt) => {
    paymentMethodMap[opt.value] = { label: opt.label, icon: opt.icon, color: opt.color };
  });

  const handleCreate = async (values: Record<string, unknown>) => {
    if (invoiceItems.length === 0) {
      message.warning(t('billing.addAtLeastOneService'));
      return;
    }
    try {
      await createInvoice.mutateAsync({
        patientId: values.patientId as string,
        discountAmount: (values.discount as number) || 0,
        notes: (values.notes as string) || undefined,
        paymentMethod: (values.paymentMethod as string) || undefined,
        items: invoiceItems.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
        })),
      } as Record<string, unknown>);
      message.success(t('common.success'));
      setIsModalOpen(false);
      form.resetFields();
      setInvoiceItems([]);
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { serviceId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: unknown) => {
    const updated = [...invoiceItems];
    if (field === 'serviceId') {
      const service = servicesList.find((s) => s.id === value);
      updated[index] = { ...updated[index], serviceId: value as string, unitPrice: service ? Number(service.price) : 0 };
    } else if (field === 'quantity') {
      updated[index] = { ...updated[index], quantity: value as number };
    } else if (field === 'unitPrice') {
      updated[index] = { ...updated[index], unitPrice: value as number };
    }
    setInvoiceItems(updated);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
    setInvoiceItems([]);
  };

  const handleRefund = async (id: string) => {
    try {
      await refundInvoice.mutateAsync(id);
      message.success(t('common.success'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const columns = [
    {
      title: '\u2116',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 160,
      render: (num: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-600)', fontSize: 13 }}>
          {num}
        </span>
      ),
    },
    {
      title: t('scheduling.patient'),
      key: 'patient',
      render: (_: unknown, record: Invoice) => {
        const p = (record as Record<string, unknown>).patient as { firstName?: string; lastName?: string } | undefined;
        const name = p ? `${p.lastName || ''} ${p.firstName || ''}`.trim() : record.patientId?.slice(0, 8) + '...';
        return (
          <Space>
            <Avatar size={28} style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', fontSize: 12 }}>
              {name.charAt(0)}
            </Avatar>
            <span style={{ fontWeight: 500 }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: t('billing.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      render: (p: number) => <span style={{ color: 'var(--gray-600)' }}>{formatPrice(p)}</span>,
    },
    {
      title: t('billing.discount'),
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 140,
      render: (p: number) => (
        <span style={{ color: p > 0 ? 'var(--danger-500)' : 'var(--gray-300)' }}>
          {p > 0 ? `- ${formatPrice(p)}` : '--'}
        </span>
      ),
    },
    {
      title: t('billing.finalAmount'),
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 160,
      render: (p: number) => (
        <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{formatPrice(p)}</span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <span className={`status-badge ${statusClassMapInv[status] || ''}`}>{invoiceStatusLabels[status] || status}</span>
      ),
    },
    {
      title: t('billing.paymentMethod'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 150,
      render: (method: string) => {
        if (!method) return <span style={{ color: 'var(--gray-300)' }}>--</span>;
        const info = paymentMethodMap[method];
        if (!info) return method;
        return (
          <Tag icon={info.icon} color={info.color}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: t('common.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => (
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          {d ? new Date(d).toLocaleDateString('ru-RU') : ''}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Invoice) => (
        <Space>
          <Tooltip title={t('common.view')}>
            <Button type="text" icon={<EyeOutlined />} size="small" style={{ color: 'var(--primary-500)' }} />
          </Tooltip>
          <Tooltip title={t('common.print')}>
            <Button type="text" icon={<PrinterOutlined />} size="small" style={{ color: 'var(--gray-400)' }} onClick={() => printInvoice(record)} />
          </Tooltip>
          {record.status === 'paid' && (
            <Tooltip title={t('billing.refund')}>
              <Button
                type="text"
                size="small"
                style={{ color: 'var(--danger-500)', fontSize: 11 }}
                onClick={() => handleRefund(record.id)}
              >
                {t('billing.refund')}
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h2>
            <DollarOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
            {t('billing.invoices')}
          </h2>
          <p className="page-header-subtitle">{t('billing.totalInvoices', { count: total })}</p>
        </div>
        <Space>
          <Select
            placeholder={t('common.status')}
            allowClear
            style={{ minWidth: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(invoiceStatusLabels).map(([value, label]) => ({ value, label }))}
          />
          <Select
            placeholder={t('billing.paymentMethod')}
            allowClear
            style={{ minWidth: 160 }}
            value={paymentMethodFilter}
            onChange={setPaymentMethodFilter}
            options={paymentMethodOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            {t('billing.newInvoice')}
          </Button>
        </Space>
      </div>

      <div className="modern-card">
        <div className="modern-card-body">
          <Table
            columns={columns}
            dataSource={paymentMethodFilter ? invoices.filter((inv: any) => inv.paymentMethod === paymentMethodFilter) : invoices}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: 20,
              total,
              onChange: (p) => setPage(p),
            }}
            size="middle"
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      <Modal
        title={t('billing.newInvoice')}
        open={isModalOpen}
        onCancel={handleModalClose}
        onOk={() => form.submit()}
        confirmLoading={createInvoice.isPending}
        width={720}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="patientId" label={t('scheduling.patient')} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t('scheduling.selectPatient')}
              filterOption={false}
              onSearch={(v) => setPatientSearch(v)}
              options={(searchedPatients || []).map((p) => ({
                value: p.id,
                label: `${p.lastName} ${p.firstName}`,
              }))}
              notFoundContent={patientSearch.length < 2 ? t('common.searchMinChars') : t('common.nothingFound')}
            />
          </Form.Item>

          <Form.Item name="paymentMethod" label={t('billing.paymentMethod')}>
            <Select
              placeholder={t('billing.paymentMethod')}
              allowClear
              options={paymentMethodOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
            />
          </Form.Item>

          <Divider orientation="left" style={{ fontSize: 13 }}>{t('billing.invoiceServices')}</Divider>

          {invoiceItems.map((item, index) => (
            <Row gutter={8} key={index} align="middle" style={{ marginBottom: 8 }}>
              <Col flex="auto" style={{ minWidth: 0 }}>
                <Select
                  placeholder={t('billing.selectService')}
                  value={item.serviceId || undefined}
                  onChange={(val) => handleItemChange(index, 'serviceId', val)}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={servicesList.filter((s) => s.isActive).map((s) => ({
                    value: s.id,
                    label: `${s.name} — ${formatCurrency(s.price)}`,
                  }))}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col style={{ width: 80 }}>
                <InputNumber
                  min={1}
                  value={item.quantity}
                  onChange={(val) => handleItemChange(index, 'quantity', val || 1)}
                  style={{ width: '100%' }}
                  placeholder={t('billing.printQty')}
                />
              </Col>
              <Col style={{ width: 120 }}>
                <InputNumber
                  min={0}
                  value={item.unitPrice}
                  onChange={(val) => handleItemChange(index, 'unitPrice', val || 0)}
                  style={{ width: '100%' }}
                  placeholder={t('billing.printPrice')}
                  readOnly
                />
              </Col>
              <Col>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(index)}
                />
              </Col>
            </Row>
          ))}

          <Button type="dashed" onClick={handleAddItem} icon={<PlusOutlined />} style={{ width: '100%', marginBottom: 16 }}>
            {t('billing.addServiceItem')}
          </Button>

          <Form.Item name="discount" label={`${t('billing.discount')} (${getCurrencySymbol()})`} initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <div style={{ background: 'var(--gray-50, #f9fafb)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <Row justify="space-between" style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--gray-500)' }}>{t('billing.subtotal')}:</span>
              <span>{formatCurrency(subtotal)}</span>
            </Row>
            {discountValue > 0 && (
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <span style={{ color: 'var(--danger-500)' }}>{t('billing.discount')}:</span>
                <span style={{ color: 'var(--danger-500)' }}>- {formatCurrency(discountValue)}</span>
              </Row>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <Row justify="space-between">
              <span style={{ fontWeight: 700 }}>{t('billing.finalAmount')}:</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(finalAmount)}</span>
            </Row>
          </div>

          <Form.Item name="notes" label={t('patients.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoicesPage;

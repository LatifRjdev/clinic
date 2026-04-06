import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  InputNumber,
  Select,
  Row,
  Col,
  Space,
  Tooltip,
  message,
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useServices, useServiceCategories, useCreateService, useUpdateService } from '../../hooks/useBilling';
import { formatCurrency, getCurrencySymbol } from '../../utils/format';
import type { Service } from '../../types';

const categoryBadgeColors: Record<string, { bg: string; color: string }> = {
  consultation: { bg: 'var(--primary-50)', color: 'var(--primary-600)' },
  procedure: { bg: 'var(--accent-50)', color: 'var(--accent-600)' },
  analysis: { bg: '#fef3c7', color: '#d97706' },
};

const BillingServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  const { data: servicesData, isLoading } = useServices({ category: categoryFilter });
  const { data: categories } = useServiceCategories();
  const createService = useCreateService();
  const updateService = useUpdateService();

  const services = servicesData?.data || [];
  const total = servicesData?.total || 0;

  const filtered = services.filter((s) => {
    if (!searchText) return true;
    return s.name.toLowerCase().includes(searchText.toLowerCase()) || s.code.includes(searchText);
  });

  const formatPrice = (price: number) => formatCurrency(price);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, data: values });
        message.success(t('common.success'));
      } else {
        await createService.mutateAsync(values);
        message.success(t('common.success'));
      }
      setIsModalOpen(false);
      setEditingService(null);
      form.resetFields();
    } catch {
      message.error(t('common.error'));
    }
  };

  const columns = [
    {
      title: t('billing.code'),
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: 'var(--gray-500)' }}>
          {code}
        </span>
      ),
    },
    {
      title: t('billing.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{name}</span>
      ),
    },
    {
      title: t('billing.category'),
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: string) => {
        const catLabels: Record<string, string> = {
          consultation: t('scheduling.consultation'),
          procedure: t('scheduling.procedure'),
          analysis: cat,
        };
        const colors = categoryBadgeColors[cat] || { bg: 'var(--gray-100)', color: 'var(--gray-500)' };
        return (
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 99,
            fontSize: 12, fontWeight: 600, background: colors.bg, color: colors.color,
          }}>
            {catLabels[cat] || cat}
          </span>
        );
      },
    },
    {
      title: t('scheduling.price'),
      dataIndex: 'price',
      key: 'price',
      width: 160,
      render: (price: number) => (
        <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{formatPrice(price)}</span>
      ),
      sorter: (a: Service, b: Service) => a.price - b.price,
    },
    {
      title: t('billing.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (d: number) => (
        <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>{d} {t('billing.min')}</span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 70,
      render: (_: unknown, record: Service) => (
        <Tooltip title={t('common.edit')}>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            style={{ color: 'var(--primary-500)' }}
            onClick={() => {
              setEditingService(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h2>
            <ShoppingOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
            {t('billing.services')}
          </h2>
          <p className="page-header-subtitle">{t('billing.totalServices', { count: total })}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingService(null); form.resetFields(); setIsModalOpen(true); }}>
          {t('billing.addService')}
        </Button>
      </div>

      <div className="modern-card">
        <div className="modern-card-body">
          <Space style={{ marginBottom: 16 }} wrap>
            <Input
              placeholder={t('common.search')}
              prefix={<SearchOutlined style={{ color: 'var(--gray-400)' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, borderRadius: 'var(--radius-md)' }}
              allowClear
            />
            <Select
              placeholder={t('billing.category')}
              allowClear
              style={{ minWidth: 140 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'consultation', label: t('scheduling.consultation') },
                { value: 'procedure', label: t('scheduling.procedure') },
                { value: 'analysis', label: t('billing.analysis') },
                ...(categories || [])
                  .filter((c: string) => !['consultation', 'procedure', 'analysis'].includes(c))
                  .map((c: string) => ({ value: c, label: c })),
              ]}
            />
          </Space>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            size="middle"
            scroll={{ x: 800 }}
          />
        </div>
      </div>

      <Modal
        title={editingService ? t('billing.editService') : t('billing.newService')}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditingService(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createService.isPending || updateService.isPending}
        width={560}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="code" label={t('billing.code')} rules={[{ required: true }]}>
                <Input placeholder="CONS-001" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item name="name" label={t('billing.name')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="category" label={t('billing.category')} rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'consultation', label: t('scheduling.consultation') },
                    { value: 'procedure', label: t('scheduling.procedure') },
                    { value: 'analysis', label: t('billing.analysis') },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="price" label={`${t('scheduling.price')} (${getCurrencySymbol()})`} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="duration" label={`${t('billing.duration')} (${t('billing.min')})`} initialValue={30}>
                <InputNumber style={{ width: '100%' }} min={5} step={5} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default BillingServicesPage;

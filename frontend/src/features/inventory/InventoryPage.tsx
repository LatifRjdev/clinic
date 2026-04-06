import React, { useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, Tag, Space, Checkbox, Badge, message } from 'antd';
import { PlusOutlined, SearchOutlined, InboxOutlined, WarningOutlined } from '@ant-design/icons';
import { useInventoryItems, useLowStock, useExpiringItems, useCreateInventoryItem, useUpdateInventoryItem, useCreateMovement } from '../../hooks/useInventory';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/format';
import type { InventoryItem } from '../../types';

const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [form] = Form.useForm();
  const [moveForm] = Form.useForm();

  const { data, isLoading } = useInventoryItems({ search: search || undefined, page, limit: 20 });
  const { data: lowStock } = useLowStock();
  const { data: expiring } = useExpiringItems(30);
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const createMovement = useCreateMovement();

  const items = data?.data || [];
  const total = data?.total || 0;

  const lowStockCount = lowStock ? (lowStock as InventoryItem[]).length : 0;

  const filteredItems = useMemo(() => {
    if (!showLowStockOnly) return items;
    return items.filter((item) => item.quantity <= item.minQuantity);
  }, [items, showLowStockOnly]);

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      const expirationDate = values.expirationDate
        ? (values.expirationDate as { format: (f: string) => string }).format('YYYY-MM-DD') : undefined;
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...values, expirationDate } as Partial<InventoryItem> & { id: string });
        message.success(t('common.saved'));
      } else {
        await createItem.mutateAsync({ ...values, expirationDate } as Partial<InventoryItem>);
        message.success(t('inventory.itemAdded'));
      }
      setIsModalOpen(false);
      setEditingItem(null);
      form.resetFields();
    } catch { message.error(t('common.error')); }
  };

  const handleMovement = async (values: Record<string, unknown>) => {
    try {
      await createMovement.mutateAsync(values);
      message.success(t('inventory.movementRecorded'));
      setIsMoveModalOpen(false);
      moveForm.resetFields();
    } catch { message.error(t('common.error')); }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      reorderLevel: item.reorderLevel,
      unit: item.unit,
      price: item.price,
      category: item.category,
      expirationDate: item.expirationDate ? dayjs(item.expirationDate) : undefined,
    });
    setIsModalOpen(true);
  };

  const getQuantityStyle = (record: InventoryItem): React.CSSProperties => {
    if (record.quantity <= record.minQuantity) {
      return { fontWeight: 600, color: 'var(--danger-500)' };
    }
    if (record.quantity <= record.minQuantity * 1.5) {
      return { fontWeight: 600, color: 'var(--warm-600)' };
    }
    return { fontWeight: 600, color: 'var(--gray-900)' };
  };

  const columns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name', render: (v: string, r: InventoryItem) => (
      <a onClick={() => handleEdit(r)} style={{ fontWeight: 600, cursor: 'pointer' }}>{v}</a>
    )},
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 100, render: (v: string) => v ? <span style={{ fontFamily: 'monospace', color: 'var(--gray-500)' }}>{v}</span> : '—' },
    { title: t('billing.category'), dataIndex: 'category', key: 'category', width: 130, render: (v: string) => v || '—' },
    {
      title: t('inventory.remainder'), key: 'quantity', width: 120,
      render: (_: unknown, r: InventoryItem) => (
        <span style={getQuantityStyle(r)}>
          {r.quantity} {r.unit}
          {r.quantity <= r.minQuantity && <WarningOutlined style={{ marginLeft: 4, color: 'var(--danger-500)' }} />}
          {r.quantity > r.minQuantity && r.quantity <= r.minQuantity * 1.5 && (
            <WarningOutlined style={{ marginLeft: 4, color: 'var(--warm-600)' }} />
          )}
        </span>
      ),
    },
    {
      title: t('inventory.minStock'), dataIndex: 'minQuantity', key: 'minQuantity', width: 100,
      render: (v: number, r: InventoryItem) => <span style={{ color: 'var(--gray-500)' }}>{v} {r.unit}</span>,
    },
    {
      title: t('scheduling.price'), dataIndex: 'price', key: 'price', width: 130,
      render: (v: number) => formatCurrency(v || 0),
    },
    {
      title: t('inventory.expirationDate'), dataIndex: 'expirationDate', key: 'expirationDate', width: 130,
      render: (d: string) => {
        if (!d) return '—';
        const isExpiring = new Date(d) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return <span style={{ color: isExpiring ? 'var(--danger-500)' : 'var(--gray-600)' }}>{new Date(d).toLocaleDateString('ru-RU')}</span>;
      },
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2>
          <InboxOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.inventory')}
          {lowStockCount > 0 && (
            <Badge
              count={`${t('inventory.lowStockBadge')}: ${lowStockCount}`}
              style={{ backgroundColor: 'var(--danger-500)', marginLeft: 12, fontSize: 12 }}
            />
          )}
        </h2>
        <Space>
          <Button onClick={() => setIsMoveModalOpen(true)}>{t('inventory.movement')}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setEditingItem(null); setIsModalOpen(true); }}>{t('inventory.addItem')}</Button>
        </Space>
      </div>

      {/* Alert badges */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {lowStock && (lowStock as InventoryItem[]).length > 0 && (
          <Col><Tag color="red" style={{ fontSize: 13, padding: '4px 12px' }}>{t('inventory.lowStockAlert', { count: (lowStock as InventoryItem[]).length })}</Tag></Col>
        )}
        {expiring && (expiring as InventoryItem[]).length > 0 && (
          <Col><Tag color="orange" style={{ fontSize: 13, padding: '4px 12px' }}>{t('inventory.expiringAlert', { count: (expiring as InventoryItem[]).length })}</Tag></Col>
        )}
      </Row>

      <div className="modern-card">
        <div className="modern-card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <Input placeholder={t('inventory.searchByName')} prefix={<SearchOutlined />} value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} allowClear style={{ maxWidth: 360 }} />
            <Checkbox checked={showLowStockOnly} onChange={(e) => { setShowLowStockOnly(e.target.checked); setPage(1); }}>
              {t('inventory.showLowStockOnly')}
            </Checkbox>
          </div>
          <Table columns={columns} dataSource={filteredItems} rowKey="id" loading={isLoading}
            pagination={{ current: page, pageSize: 20, total: showLowStockOnly ? filteredItems.length : total, onChange: (p) => setPage(p) }} size="middle"
            scroll={{ x: 900 }} />
        </div>
      </div>

      {/* New / Edit item modal */}
      <Modal title={editingItem ? t('inventory.editItem') : t('inventory.newItem')} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditingItem(null); }} onOk={() => form.submit()}
        confirmLoading={createItem.isPending || updateItem.isPending} okText={t('common.save')} cancelText={t('common.cancel')} width={560}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={24} sm={16}><Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="sku" label="SKU"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={6}><Form.Item name="quantity" label={t('inventory.quantity')} rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={6}><Form.Item name="minQuantity" label={t('inventory.minStock')} initialValue={10}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={6}><Form.Item name="unit" label={t('inventory.unitLabel')} initialValue={t('common.pcs')}><Input /></Form.Item></Col>
            <Col xs={24} sm={6}><Form.Item name="reorderLevel" label={t('inventory.reorderLevel')}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}><Form.Item name="price" label={t('scheduling.price')}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="category" label={t('billing.category')}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="expirationDate" label={t('inventory.expirationDate')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Movement modal */}
      <Modal title={t('inventory.movementTitle')} open={isMoveModalOpen} onCancel={() => setIsMoveModalOpen(false)} onOk={() => moveForm.submit()}
        confirmLoading={createMovement.isPending} okText={t('inventory.record')} cancelText={t('common.cancel')} width={480}>
        <Form form={moveForm} layout="vertical" onFinish={handleMovement}>
          <Form.Item name="itemId" label={t('inventory.item')} rules={[{ required: true }]}>
            <Select showSearch placeholder={t('inventory.selectItem')} filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            } options={items.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit})` }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="type" label={t('counterparty.type')} rules={[{ required: true }]}>
              <Select options={[
                { value: 'receipt', label: t('inventory.movementReceipt') },
                { value: 'consumption', label: t('inventory.movementConsumption') },
                { value: 'write_off', label: t('inventory.movementWriteOff') },
                { value: 'transfer', label: t('inventory.movementTransfer') },
              ]} />
            </Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="quantity" label={t('inventory.quantity')} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item></Col>
          </Row>
          <Form.Item name="notes" label={t('inventory.notes')}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;

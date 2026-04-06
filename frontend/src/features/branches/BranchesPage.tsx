import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Row, Col, Tag, Space, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, BankOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useBranches, useCreateBranch, useUpdateBranch } from '../../hooks/useBranches';
import { useTranslation } from 'react-i18next';
import type { Branch } from '../../types';

const BranchesPage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form] = Form.useForm();

  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editing) {
        await updateBranch.mutateAsync({ id: editing.id, data: values });
        message.success(t('branches.branchUpdated'));
      } else {
        await createBranch.mutateAsync(values);
        message.success(t('branches.branchCreated'));
      }
      setIsModalOpen(false);
      setEditing(null);
      form.resetFields();
    } catch { message.error(t('common.error')); }
  };

  const columns = [
    {
      title: t('common.name'), dataIndex: 'name', key: 'name',
      render: (name: string, record: Branch) => (
        <Space>
          <BankOutlined style={{ color: 'var(--primary-500)' }} />
          <span style={{ fontWeight: 600 }}>{name}</span>
          {record.isMain && <Tag color="gold">{t('branches.main')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('patients.address'), dataIndex: 'address', key: 'address',
      render: (v: string) => <span style={{ color: 'var(--gray-600)' }}><EnvironmentOutlined style={{ marginRight: 4 }} />{v}</span>,
    },
    {
      title: t('patients.phone'), dataIndex: 'phone', key: 'phone',
      render: (v: string) => v ? <span><PhoneOutlined style={{ marginRight: 4 }} />{v}</span> : '—',
    },
    {
      title: t('common.status'), dataIndex: 'isActive', key: 'isActive', width: 100,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('branches.active') : t('branches.inactive')}</Tag>,
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: unknown, record: Branch) => (
        <Tooltip title={t('common.edit')}>
          <Button type="text" icon={<EditOutlined />} size="small"
            onClick={() => { setEditing(record); form.setFieldsValue(record); setIsModalOpen(true); }} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><BankOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.branches')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setIsModalOpen(true); }}>
          {t('branches.addBranch')}
        </Button>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Table columns={columns} dataSource={branches || []} rowKey="id" loading={isLoading} pagination={false} size="middle" scroll={{ x: 700 }} />
        </div>
      </div>
      <Modal title={editing ? t('branches.editBranch') : t('branches.newBranch')} open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditing(null); }} onOk={() => form.submit()}
        confirmLoading={createBranch.isPending || updateBranch.isPending} okText={t('common.save')} cancelText={t('common.cancel')} width={560}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label={t('patients.address')} rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="phone" label={t('patients.phone')}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="email" label={t('patients.email')}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="isMain" label={t('branches.mainBranch')} valuePropName="checked"><Switch /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="isActive" label={t('branches.active')} valuePropName="checked" initialValue={true}><Switch /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label={t('branches.description')}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BranchesPage;

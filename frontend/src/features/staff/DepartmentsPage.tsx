import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Tooltip, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../../hooks/useDepartments';
import type { Department } from '../../types';

const DepartmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const { data: departments, isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const depts: Department[] = Array.isArray(departments) ? departments : [];

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    form.setFieldsValue(dept);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      if (editingDept) {
        await updateDept.mutateAsync({ id: editingDept.id, data: values as Partial<Department> });
        message.success(t('departments.updated'));
      } else {
        await createDept.mutateAsync(values as Partial<Department>);
        message.success(t('departments.created'));
      }
      setModalOpen(false);
      setEditingDept(null);
      form.resetFields();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDept.mutateAsync(id);
      message.success(t('departments.deleted'));
    } catch {
      message.error(t('departments.deleteError'));
    }
  };

  const columns = [
    {
      title: t('billing.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: t('billing.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => (
        <span style={{
          fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
          background: 'var(--primary-50)', color: 'var(--primary-600)',
        }}>
          {code}
        </span>
      ),
    },
    {
      title: t('departments.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => (
        <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>{desc || '—'}</span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (active: boolean) => (
        <span className={`status-badge ${active ? 'confirmed' : 'cancelled'}`}>
          {active ? t('departments.active') : t('departments.inactive')}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Department) => (
        <Space size={4}>
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm title={t('departments.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
            <Tooltip title={t('common.delete')}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2>
          <ApartmentOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
          {t('nav.departments')}
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingDept(null); form.resetFields(); setModalOpen(true); }}>
          {t('departments.addDepartment')}
        </Button>
      </div>

      <div className="modern-card">
        <div className="modern-card-body">
          <Table
            columns={columns}
            dataSource={depts.map((d) => ({ ...d, key: d.id }))}
            loading={isLoading}
            pagination={false}
            size="middle"
            scroll={{ x: 700 }}
            locale={{ emptyText: t('departments.noDepartments') }}
          />
        </div>
      </div>

      <Modal
        title={editingDept ? t('departments.editDepartment') : t('departments.newDepartment')}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingDept(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createDept.isPending || updateDept.isPending}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ isActive: true }}>
          <Form.Item name="name" label={t('billing.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t('billing.code')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('departments.description')}>
            <Input.TextArea rows={2} placeholder={t('departments.descriptionPlaceholder')} />
          </Form.Item>
          <Form.Item name="isActive" label={t('departments.active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;

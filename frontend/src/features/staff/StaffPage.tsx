import React, { useState } from 'react';
import { Table, Input, Select, Space, Avatar, Tag, Button, Tooltip, Row, Col, Modal, Form, message } from 'antd';
import { SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSystemUsers, useBlockUser, useUnblockUser } from '../../hooks/useSystem';
import { authService } from '../../api/services/auth.service';
import type { User, UserRole } from '../../types';

const roleColors: Record<string, string> = {
  owner: 'gold',
  chief_doctor: 'purple',
  doctor: 'blue',
  admin: 'cyan',
  nurse: 'green',
  accountant: 'orange',
  sysadmin: 'red',
  patient: 'default',
};

const inviteRoleKeys = ['doctor', 'chief_doctor', 'admin', 'nurse', 'accountant', 'sysadmin'] as const;

const StaffPage: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useSystemUsers({ search: search || undefined, role: roleFilter, page, limit: 20 });
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const users = data?.data || [];
  const total = data?.total || 0;

  const roleLabels: Record<string, string> = {
    owner: t('roles.owner'),
    chief_doctor: t('roles.chief_doctor'),
    doctor: t('roles.doctor'),
    admin: t('roles.admin'),
    nurse: t('roles.nurse'),
    accountant: t('roles.accountant'),
    sysadmin: t('roles.sysadmin'),
    reception: t('roles.reception'),
    patient: t('roles.patient'),
  };

  const inviteRoles = inviteRoleKeys.map((key) => ({ value: key, label: roleLabels[key] }));

  const handleBlock = async (id: string) => {
    await blockUser.mutateAsync(id);
    message.success(t('staff.userBlocked'));
  };
  const handleUnblock = async (id: string) => {
    await unblockUser.mutateAsync(id);
    message.success(t('staff.userUnblocked'));
  };

  const handleInvite = async (values: Record<string, string>) => {
    setInviteLoading(true);
    try {
      const result = await authService.invite({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        role: values.role,
        specialty: values.specialty || undefined,
      });
      message.success(t('staff.inviteSent'));
      if (result?.token) {
        Modal.info({
          title: t('staff.inviteTokenTitle'),
          content: (
            <div>
              <p>{t('staff.inviteTokenDescription')}</p>
              <Input.TextArea value={result.token} readOnly rows={2} style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }} />
            </div>
          ),
          width: 500,
        });
      }
      form.resetFields();
      setInviteOpen(false);
      refetch();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('staff.inviteError'));
    } finally {
      setInviteLoading(false);
    }
  };

  const columns = [
    {
      title: t('staff.employee'), key: 'name',
      render: (_: unknown, r: User) => (
        <Space>
          <Avatar size={36} style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
            {r.lastName?.charAt(0)}{r.firstName?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{r.lastName} {r.firstName} {r.middleName || ''}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: t('staff.role'), dataIndex: 'role', key: 'role', width: 150,
      render: (role: UserRole) => {
        const color = roleColors[role] || 'default';
        const label = roleLabels[role] || role;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    { title: t('staff.phone'), dataIndex: 'phone', key: 'phone', width: 150 },
    {
      title: t('staff.specialty'), dataIndex: 'specialty', key: 'specialty', width: 150,
      render: (v: string) => v || '—',
    },
    {
      title: t('common.status'), dataIndex: 'isActive', key: 'isActive', width: 100,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('staff.active') : t('staff.blocked')}</Tag>,
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: unknown, r: User) => (
        <Tooltip title={r.isActive ? t('staff.block') : t('staff.unblock')}>
          <Button type="text" size="small"
            icon={r.isActive ? <LockOutlined /> : <UnlockOutlined />}
            style={{ color: r.isActive ? 'var(--danger-500)' : 'var(--accent-500)' }}
            onClick={() => r.isActive ? handleBlock(r.id) : handleUnblock(r.id)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><UserOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.staff')}</h2>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setInviteOpen(true)}>
          {t('staff.addEmployee')}
        </Button>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <Input placeholder={t('staff.searchPlaceholder')} prefix={<SearchOutlined />}
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} allowClear style={{ maxWidth: 360 }} />
            </Col>
            <Col>
              <Select placeholder={t('staff.role')} allowClear style={{ minWidth: 140 }} value={roleFilter}
                onChange={(v) => { setRoleFilter(v); setPage(1); }}
                options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} />
            </Col>
          </Row>
          <Table columns={columns} dataSource={users} rowKey="id" loading={isLoading}
            pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p) }} size="middle"
            scroll={{ x: 800 }} />
        </div>
      </div>

      <Modal
        title={<><UserAddOutlined style={{ marginRight: 8 }} /> {t('staff.inviteEmployee')}</>}
        open={inviteOpen}
        onCancel={() => { setInviteOpen(false); form.resetFields(); }}
        footer={null}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleInvite} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="lastName" label={t('patients.lastName')} rules={[{ required: true, message: t('staff.enterLastName') }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="firstName" label={t('patients.firstName')} rules={[{ required: true, message: t('staff.enterFirstName') }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label={t('auth.email')} rules={[
            { required: true, message: t('staff.enterEmail') },
            { type: 'email', message: t('staff.invalidEmail') },
          ]}>
            <Input placeholder="doctor@clinic.tj" />
          </Form.Item>
          <Form.Item name="phone" label={t('patients.phone')} rules={[{ required: true, message: t('staff.enterPhone') }]}>
            <Input placeholder="+992 900 00 00 00" />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="role" label={t('staff.role')} rules={[{ required: true, message: t('staff.selectRole') }]}>
                <Select placeholder={t('staff.selectRole')} options={inviteRoles} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="specialty" label={t('staff.specialty')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setInviteOpen(false); form.resetFields(); }}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={inviteLoading} icon={<PlusOutlined />}>
                {t('staff.invite')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffPage;

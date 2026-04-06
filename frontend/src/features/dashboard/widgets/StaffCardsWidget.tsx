import React, { useState, useMemo } from 'react';
import { Row, Col, Avatar, Tag, Select, Segmented, Spin, Table, Space, Empty } from 'antd';
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  PhoneOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSystemUsers } from '../../../hooks/useSystem';
import { useDepartments } from '../../../hooks/useDepartments';
import type { User, UserRole } from '../../../types';

const roleColors: Record<string, string> = {
  owner: 'gold',
  chief_doctor: 'purple',
  doctor: 'blue',
  admin: 'orange',
  nurse: 'green',
  accountant: 'cyan',
  sysadmin: 'red',
  reception: 'purple',
  patient: 'default',
};

const avatarColors: Record<string, string> = {
  owner: '#faad14',
  chief_doctor: '#722ed1',
  doctor: '#1677ff',
  admin: '#fa8c16',
  nurse: '#52c41a',
  accountant: '#13c2c2',
  sysadmin: '#f5222d',
  reception: '#722ed1',
};

const StaffCardsWidget: React.FC = () => {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<string | number>('cards');

  const { data, isLoading } = useSystemUsers({ role: roleFilter, limit: 100 }) as { data: { data?: User[] } | undefined; isLoading: boolean };
  const { data: departments } = useDepartments() as { data: { id: string; name: string }[] | { data: { id: string; name: string }[] } | undefined };

  const users: User[] = data?.data || [];

  const deptMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(departments)) {
      departments.forEach((d) => { map[d.id] = d.name; });
    } else if (departments?.data) {
      departments.data.forEach((d: { id: string; name: string }) => { map[d.id] = d.name; });
    }
    return map;
  }, [departments]);

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

  const staffRoles = ['doctor', 'chief_doctor', 'admin', 'nurse', 'accountant', 'sysadmin', 'reception'];

  const roleOptions = staffRoles.map((key) => ({
    value: key,
    label: roleLabels[key] || key,
  }));

  const filteredUsers = roleFilter
    ? users.filter((u) => u.role === roleFilter)
    : users.filter((u) => u.role !== 'patient');

  const getInitials = (user: User) =>
    `${user.lastName?.charAt(0) || ''}${user.firstName?.charAt(0) || ''}`;

  const columns = [
    {
      title: t('staff.employee'),
      key: 'name',
      render: (_: unknown, r: User) => (
        <Space>
          <Avatar
            size={36}
            src={r.photoUrl || undefined}
            style={
              !r.photoUrl
                ? { background: avatarColors[r.role] || '#1677ff', color: '#fff' }
                : undefined
            }
          >
            {!r.photoUrl && getInitials(r)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>
              {r.lastName} {r.firstName}
            </div>
            {r.specialty && (
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.specialty}</div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: t('staff.role'),
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: UserRole) => (
        <Tag color={roleColors[role] || 'default'}>{roleLabels[role] || role}</Tag>
      ),
    },
    {
      title: t('staff.department'),
      key: 'department',
      width: 150,
      render: (_: unknown, r: User) =>
        r.departmentId ? deptMap[r.departmentId] || '—' : '—',
    },
    {
      title: t('staff.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>
          {v ? t('staff.active') : t('staff.blocked')}
        </Tag>
      ),
    },
  ];

  return (
    <div className="modern-card" style={{ marginTop: 28 }}>
      <div className="modern-card-body">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: 'var(--primary-500)' }} />
            {t('dashboard.ourStaff')}
          </h3>
          <Space wrap>
            <Select
              placeholder={t('dashboard.filterByRole')}
              allowClear
              style={{ minWidth: 160 }}
              value={roleFilter}
              onChange={(v) => setRoleFilter(v)}
              options={roleOptions}
            />
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'cards', icon: <AppstoreOutlined /> },
                { value: 'list', icon: <UnorderedListOutlined /> },
              ]}
            />
          </Space>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Empty description={t('dashboard.noStaffFound')} />
        ) : viewMode === 'cards' ? (
          <Row gutter={[16, 16]}>
            {filteredUsers.map((user) => (
              <Col xs={24} sm={12} md={8} lg={6} key={user.id}>
                <div
                  style={{
                    background: 'var(--bg-secondary, #fafafa)',
                    borderRadius: 12,
                    padding: 20,
                    textAlign: 'center',
                    border: '1px solid var(--border-color, #f0f0f0)',
                    position: 'relative',
                    transition: 'box-shadow 0.2s',
                  }}
                  className="staff-card-hover"
                >
                  {/* Status indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: user.isActive ? '#52c41a' : '#ff4d4f',
                    }}
                    title={user.isActive ? t('staff.active') : t('staff.blocked')}
                  />

                  {/* Avatar */}
                  <Avatar
                    size={64}
                    src={user.photoUrl || undefined}
                    icon={!user.photoUrl && !getInitials(user) ? <UserOutlined /> : undefined}
                    style={
                      !user.photoUrl
                        ? {
                            background: avatarColors[user.role] || '#1677ff',
                            color: '#fff',
                            fontSize: 22,
                            marginBottom: 12,
                          }
                        : { marginBottom: 12 }
                    }
                  >
                    {!user.photoUrl && getInitials(user)}
                  </Avatar>

                  {/* Name */}
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {user.lastName} {user.firstName}
                  </div>

                  {/* Role tag */}
                  <Tag
                    color={roleColors[user.role] || 'default'}
                    style={{ marginBottom: 8 }}
                  >
                    {roleLabels[user.role] || user.role}
                  </Tag>

                  {/* Specialty */}
                  {user.specialty && (
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>
                      {user.specialty}
                    </div>
                  )}

                  {/* Qualification */}
                  {user.qualification && (
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>
                      {user.qualification}
                    </div>
                  )}

                  {/* Department */}
                  {user.departmentId && deptMap[user.departmentId] && (
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
                      {deptMap[user.departmentId]}
                    </div>
                  )}

                  {/* Phone */}
                  {user.phone && (
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      {user.phone}
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 700 }}
          />
        )}
      </div>
    </div>
  );
};

export default StaffCardsWidget;

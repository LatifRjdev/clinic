import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, Avatar, Switch, Select, Divider, message, Spin, Modal, TimePicker, InputNumber } from 'antd';
import {
  UserOutlined, LockOutlined, SaveOutlined, BellOutlined,
  CalendarOutlined, MedicineBoxOutlined, DollarOutlined,
  SettingOutlined, PhoneOutlined, EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../api/services/auth.service';
import { useNotificationSettings, useUpdateNotificationSettings } from '../../hooks/useNotifications';
import { useSchedules, useCreateSchedule, useUpdateSchedule } from '../../hooks/useAppointments';
import { useUserSettings, useUpdateUserSettings } from '../../hooks/useUserSettings';
import type { NotificationSettings, DoctorSchedule } from '../../types';

// ── Personal Info Card (all roles) ──
const PersonalInfoCard: React.FC<{
  user: any;
  fetchProfile: () => Promise<void>;
}> = ({ user, fetchProfile }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await authService.updateProfile(values);
      await fetchProfile();
      message.success(t('profile.profileUpdated'));
    } catch { message.error(t('profile.profileUpdateError')); }
    finally { setSaving(false); }
  };

  return (
    <div className="modern-card" style={{ marginBottom: 24 }}>
      <div className="modern-card-header"><h3>{t('profile.personalInfo')}</h3></div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
          <Avatar size={72} style={{ background: 'var(--primary-500)', fontSize: 28, fontWeight: 700 }}>
            {user.lastName?.charAt(0)}{user.firstName?.charAt(0)}
          </Avatar>
          <div style={{ textAlign: 'center', flex: '1 1 200px' }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{user.lastName} {user.firstName} {user.middleName || ''}</div>
            <div style={{ color: 'var(--gray-400)', fontSize: 13 }}>{user.email}</div>
            <div style={{
              marginTop: 4, display: 'inline-block', padding: '2px 10px', borderRadius: 99,
              background: 'var(--primary-50)', color: 'var(--primary-600)', fontSize: 12, fontWeight: 600,
            }}>
              {String(t(`roles.${user.role}`, user.role))}
            </div>
          </div>
        </div>
        <Form form={form} layout="vertical" initialValues={user} onFinish={handleUpdate}>
          <Row gutter={16}>
            <Col xs={24} sm={8}><Form.Item name="lastName" label={t('patients.lastName')} rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="firstName" label={t('patients.firstName')} rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="middleName" label={t('patients.middleName')}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="phone" label={t('patients.phone')} rules={[{ required: true }]}><Input prefix={<PhoneOutlined />} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="email" label={t('auth.email')}><Input disabled /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="preferredLanguage" label={t('profile.interfaceLanguage')}>
                <Select options={[{ value: 'ru', label: t('common.languageRu') }, { value: 'tj', label: t('common.languageTj') }, { value: 'en', label: t('common.languageEn') }]} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>{t('common.save')}</Button>
        </Form>
      </div>
    </div>
  );
};

// ── Password Card (all roles) ──
const PasswordCard: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleChange = async (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      message.success(t('profile.passwordChanged'));
      form.resetFields();
    } catch { message.error(t('profile.passwordChangeError')); }
    finally { setLoading(false); }
  };

  return (
    <div className="modern-card" style={{ marginBottom: 24 }}>
      <div className="modern-card-header"><h3><LockOutlined style={{ marginRight: 8 }} />{t('profile.changePassword')}</h3></div>
      <div className="modern-card-body">
        <Form form={form} layout="vertical" onFinish={handleChange}>
          <Form.Item name="currentPassword" label={t('profile.currentPassword')} rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label={t('profile.newPassword')} rules={[{ required: true, min: 6, message: t('profile.passwordMinLength') }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('profile.confirmPassword')}
            dependencies={['newPassword']}
            rules={[{ required: true }, ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error(t('profile.passwordsNoMatch')));
              },
            })]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>{t('profile.changePassword')}</Button>
        </Form>
      </div>
    </div>
  );
};

// ── Notification Settings Card (all roles) ──
const NotificationSettingsCard: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useNotificationSettings(userId);
  const update = useUpdateNotificationSettings();

  const handleToggle = (field: keyof NotificationSettings, value: boolean) => {
    update.mutate({ userId, data: { [field]: value } }, {
      onSuccess: () => message.success(t('profile.notificationSettingsUpdated')),
      onError: () => message.error(t('profile.profileUpdateError')),
    });
  };

  if (isLoading) return null;

  const s = settings as NotificationSettings | undefined;

  const items = [
    { key: 'appointmentNotifications' as const, label: t('profile.appointmentNotifications'), icon: <CalendarOutlined /> },
    { key: 'messageNotifications' as const, label: t('profile.chatMessages'), icon: <BellOutlined /> },
    { key: 'taskNotifications' as const, label: t('profile.taskNotifications'), icon: <SettingOutlined /> },
    { key: 'systemNotifications' as const, label: t('profile.systemNotifications'), icon: <BellOutlined /> },
  ];

  const channels = [
    { key: 'emailEnabled' as const, label: 'Email' },
    { key: 'smsEnabled' as const, label: 'SMS' },
    { key: 'telegramEnabled' as const, label: 'Telegram' },
    { key: 'pushEnabled' as const, label: 'Push' },
  ];

  return (
    <div className="modern-card" style={{ marginBottom: 24 }}>
      <div className="modern-card-header"><h3><BellOutlined style={{ marginRight: 8 }} />{t('profile.notifications')}</h3></div>
      <div className="modern-card-body">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>{t('profile.deliveryChannels')}</div>
          {channels.map((ch) => (
            <div key={ch.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: 14 }}>{ch.label}</span>
              <Switch
                size="small"
                checked={s?.[ch.key] ?? false}
                onChange={(v) => handleToggle(ch.key, v)}
              />
            </div>
          ))}
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>{t('profile.notificationTypes')}</div>
          {items.map((item) => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                {item.icon} {item.label}
              </span>
              <Switch
                size="small"
                checked={s?.[item.key] ?? true}
                onChange={(v) => handleToggle(item.key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Doctor-specific: Medical Profile ──
const DoctorProfileCard: React.FC<{ user: any; fetchProfile: () => Promise<void> }> = ({ user, fetchProfile }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await authService.updateProfile(values);
      await fetchProfile();
      message.success(t('profile.medProfileUpdated'));
    } catch { message.error(t('profile.saveError')); }
    finally { setSaving(false); }
  };

  return (
    <div className="modern-card" style={{ marginBottom: 24 }}>
      <div className="modern-card-header"><h3><MedicineBoxOutlined style={{ marginRight: 8 }} />{t('profile.medProfile')}</h3></div>
      <div className="modern-card-body">
        <Form form={form} layout="vertical" initialValues={user} onFinish={handleSave}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="specialty" label={t('staff.specialty')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="qualification" label={t('emr.examination')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="licenseNumber" label={t('staff.license')}>
                <Input placeholder="LIC-XXX" />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>{t('common.save')}</Button>
        </Form>
      </div>
    </div>
  );
};

// ── Doctor-specific: My Schedule Overview ──
const MyScheduleCard: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data: schedules } = useSchedules({ doctorId: userId });
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  interface ScheduleRow {
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
    breakStart: string;
    breakEnd: string;
    slotDuration: number;
    existingId?: string;
  }

  const items: DoctorSchedule[] = Array.isArray(schedules) ? schedules : (schedules as unknown as { data: DoctorSchedule[] })?.data || [];
  const active = items.filter((s) => s.isActive).sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const dayNames: Record<number, string> = {
    1: t('common.mon'), 2: t('common.tue'), 3: t('common.wed'),
    4: t('common.thu'), 5: t('common.fri'), 6: t('common.sat'),
    0: t('common.sun'),
  };

  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  const buildInitialRows = (): ScheduleRow[] => {
    return dayOrder.map((dow) => {
      const existing = items.find((s) => s.dayOfWeek === dow);
      return {
        dayOfWeek: dow,
        isActive: existing?.isActive ?? false,
        startTime: existing?.startTime?.slice(0, 5) || '08:00',
        endTime: existing?.endTime?.slice(0, 5) || '17:00',
        breakStart: existing?.breakStart?.slice(0, 5) || '',
        breakEnd: existing?.breakEnd?.slice(0, 5) || '',
        slotDuration: existing?.slotDuration || 20,
        existingId: existing?.id,
      };
    });
  };

  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(buildInitialRows);

  const openEditModal = () => {
    setScheduleRows(buildInitialRows());
    setEditModalOpen(true);
  };

  const updateRow = (index: number, field: keyof ScheduleRow, value: unknown) => {
    setScheduleRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      for (const row of scheduleRows) {
        const payload: Partial<DoctorSchedule> = {
          doctorId: userId,
          dayOfWeek: row.dayOfWeek,
          isActive: row.isActive,
          startTime: row.startTime,
          endTime: row.endTime,
          breakStart: row.breakStart || undefined,
          breakEnd: row.breakEnd || undefined,
          slotDuration: row.slotDuration,
        };
        if (row.existingId) {
          await updateSchedule.mutateAsync({ id: row.existingId, data: payload });
        } else if (row.isActive) {
          await createSchedule.mutateAsync(payload);
        }
      }
      message.success(t('profile.scheduleUpdated'));
      setEditModalOpen(false);
    } catch {
      message.error(t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modern-card" style={{ marginBottom: 24 }}>
      <div className="modern-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3><CalendarOutlined style={{ marginRight: 8 }} />{t('profile.mySchedule')}</h3>
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={openEditModal}
        >
          {t('profile.editSchedule')}
        </Button>
      </div>
      <div className="modern-card-body">
        {active.length === 0 ? (
          <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 12 }}>
            {t('profile.scheduleNotConfigured')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {active.map((s) => (
              <div key={s.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 10, background: 'var(--gray-50)',
              }}>
                <span style={{ fontWeight: 600, fontSize: 13, minWidth: 30 }}>{dayNames[s.dayOfWeek]}</span>
                <span style={{ fontSize: 13 }}>{s.startTime?.slice(0, 5)} — {s.endTime?.slice(0, 5)}</span>
                {s.breakStart && (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {t('profile.break')} {s.breakStart?.slice(0, 5)}–{s.breakEnd?.slice(0, 5)}
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--primary-600)', fontWeight: 600 }}>{s.slotDuration} {t('billing.min')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Edit Modal */}
      <Modal
        title={t('profile.editSchedule')}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSaveSchedule}
        confirmLoading={saving}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        width={780}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Header */}
          <Row gutter={8} style={{ fontWeight: 600, fontSize: 12, color: 'var(--gray-500)', paddingBottom: 4 }}>
            <Col span={2}></Col>
            <Col span={3}>{t('scheduling.day')}</Col>
            <Col span={4}>{t('scheduling.startTime')}</Col>
            <Col span={4}>{t('scheduling.endTime')}</Col>
            <Col span={3}>{t('scheduling.breakFrom')}</Col>
            <Col span={3}>{t('scheduling.breakTo')}</Col>
            <Col span={3}>{t('scheduling.slotDuration')}</Col>
          </Row>
          {scheduleRows.map((row, idx) => (
            <Row key={row.dayOfWeek} gutter={8} align="middle" style={{
              padding: '6px 0', borderRadius: 8,
              background: row.isActive ? 'var(--primary-50)' : 'var(--gray-50)',
            }}>
              <Col span={2}>
                <Switch
                  size="small"
                  checked={row.isActive}
                  onChange={(v) => updateRow(idx, 'isActive', v)}
                />
              </Col>
              <Col span={3}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{dayNames[row.dayOfWeek]}</span>
              </Col>
              <Col span={4}>
                <TimePicker
                  size="small"
                  format="HH:mm"
                  minuteStep={5}
                  disabled={!row.isActive}
                  value={row.startTime ? dayjs(row.startTime, 'HH:mm') : undefined}
                  onChange={(v) => updateRow(idx, 'startTime', v ? v.format('HH:mm') : '')}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <TimePicker
                  size="small"
                  format="HH:mm"
                  minuteStep={5}
                  disabled={!row.isActive}
                  value={row.endTime ? dayjs(row.endTime, 'HH:mm') : undefined}
                  onChange={(v) => updateRow(idx, 'endTime', v ? v.format('HH:mm') : '')}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={3}>
                <TimePicker
                  size="small"
                  format="HH:mm"
                  minuteStep={5}
                  disabled={!row.isActive}
                  value={row.breakStart ? dayjs(row.breakStart, 'HH:mm') : undefined}
                  onChange={(v) => updateRow(idx, 'breakStart', v ? v.format('HH:mm') : '')}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col span={3}>
                <TimePicker
                  size="small"
                  format="HH:mm"
                  minuteStep={5}
                  disabled={!row.isActive}
                  value={row.breakEnd ? dayjs(row.breakEnd, 'HH:mm') : undefined}
                  onChange={(v) => updateRow(idx, 'breakEnd', v ? v.format('HH:mm') : '')}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col span={3}>
                <InputNumber
                  size="small"
                  min={5}
                  max={120}
                  step={5}
                  disabled={!row.isActive}
                  value={row.slotDuration}
                  onChange={(v) => updateRow(idx, 'slotDuration', v || 20)}
                  style={{ width: '100%' }}
                  suffix={t('billing.min')}
                />
              </Col>
            </Row>
          ))}
        </div>
      </Modal>
    </div>
  );
};

// ── Generic Settings Card with persistence ──
const SettingsCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: Array<{ key: string; label: string; defaultValue: boolean }>;
}> = ({ title, icon, items }) => {
  const { t } = useTranslation();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => message.success(t('profile.settingsUpdated')),
      onError: () => message.error(t('profile.profileUpdateError')),
    });
  };

  return (
    <div className="modern-card" style={{ marginBottom: 24 }}>
      <div className="modern-card-header"><h3>{icon} {title}</h3></div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>{item.label}</span>
              <Switch
                size="small"
                checked={settings?.[item.key] ?? item.defaultValue}
                onChange={(v) => handleToggle(item.key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Reception-specific: Work Preferences ──
const ReceptionPreferencesCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SettingsCard
      title={t('profile.receptionSettings')}
      icon={<PhoneOutlined style={{ marginRight: 8 }} />}
      items={[
        { key: 'soundOnNewAppointment', label: t('profile.soundOnNewAppointment'), defaultValue: true },
        { key: 'autoOpenPatientCard', label: t('profile.autoOpenPatientCard'), defaultValue: true },
        { key: 'showNextDayAppointments', label: t('profile.showNextDayAppointments'), defaultValue: true },
        { key: 'remind15minBefore', label: t('profile.remind15minBefore'), defaultValue: true },
      ]}
    />
  );
};

// ── Accountant-specific: Finance Preferences ──
const AccountantPreferencesCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SettingsCard
      title={t('profile.financeSettings')}
      icon={<DollarOutlined style={{ marginRight: 8 }} />}
      items={[
        { key: 'overdueInvoiceAlert', label: t('profile.overdueInvoiceAlert'), defaultValue: true },
        { key: 'dailyEmailReport', label: t('profile.dailyEmailReport'), defaultValue: false },
        { key: 'autoPayroll', label: t('profile.autoPayroll'), defaultValue: false },
        { key: 'cashCloseReminder', label: t('profile.cashCloseReminder'), defaultValue: true },
      ]}
    />
  );
};

// ── Nurse-specific: Work Preferences ──
const NursePreferencesCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SettingsCard
      title={t('profile.nurseSettings')}
      icon={<MedicineBoxOutlined style={{ marginRight: 8 }} />}
      items={[
        { key: 'lowStockAlert', label: t('profile.lowStockAlert'), defaultValue: true },
        { key: 'showDoctorTasks', label: t('profile.showDoctorTasks'), defaultValue: true },
        { key: 'newPatientAlert', label: t('profile.newPatientAlert'), defaultValue: true },
      ]}
    />
  );
};

// ── Admin-specific: System Preferences ──
const AdminPreferencesCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SettingsCard
      title={t('profile.adminSettings')}
      icon={<SettingOutlined style={{ marginRight: 8 }} />}
      items={[
        { key: 'newEmployeeAlert', label: t('profile.newEmployeeAlert'), defaultValue: true },
        { key: 'systemErrorAlert', label: t('profile.systemErrorAlert'), defaultValue: true },
        { key: 'weeklySummary', label: t('profile.weeklySummary'), defaultValue: false },
        { key: 'userAudit', label: t('profile.userAudit'), defaultValue: true },
      ]}
    />
  );
};

// ═══════════════════════ MAIN PAGE ═══════════════════════

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, fetchProfile } = useAuthStore();

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;

  const role = user.role;
  const isDoctor = role === 'doctor' || role === 'chief_doctor';
  const isNurse = role === 'nurse';
  const isReception = role === 'reception';
  const isAccountant = role === 'accountant';
  const isAdmin = role === 'admin' || role === 'owner' || role === 'sysadmin';

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><UserOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('profile.title')}</h2>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <PersonalInfoCard user={user} fetchProfile={fetchProfile} />
          {isDoctor && <DoctorProfileCard user={user} fetchProfile={fetchProfile} />}
          {isDoctor && <MyScheduleCard userId={user.id} />}
          {isReception && <ReceptionPreferencesCard />}
          {isAccountant && <AccountantPreferencesCard />}
          {isNurse && <NursePreferencesCard />}
          {isAdmin && <AdminPreferencesCard />}
        </Col>

        <Col xs={24} lg={8}>
          <PasswordCard />
          <NotificationSettingsCard userId={user.id} />
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;

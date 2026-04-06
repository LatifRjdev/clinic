import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, TimePicker, InputNumber, Switch, Space, Tag, message, Empty, Popconfirm } from 'antd';
import { SettingOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSchedules, useCreateSchedule, useUpdateSchedule } from '../../hooks/useAppointments';
import { schedulesService } from '../../api/services/scheduling.service';
import { useAuthStore } from '../../store/authStore';
import { useSystemUsers } from '../../hooks/useSystem';
import type { DoctorSchedule } from '../../types';
import dayjs from 'dayjs';

const slotOptions = [
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 45, label: '45' },
  { value: 60, label: '60' },
];

const DoctorSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const isAdmin = user?.role === 'owner' || user?.role === 'sysadmin' || user?.role === 'chief_doctor' || user?.role === 'admin';
  const doctorId = selectedDoctorId || user?.id;

  const { data: doctorsData } = useSystemUsers({ role: 'doctor', limit: 200 });
  const { data: schedules, isLoading, refetch } = useSchedules({ doctorId });
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();

  const doctors = doctorsData?.data || [];

  const dayNames: Record<number, string> = {
    0: t('scheduling.sunday'),
    1: t('scheduling.monday'),
    2: t('scheduling.tuesday'),
    3: t('scheduling.wednesday'),
    4: t('scheduling.thursday'),
    5: t('scheduling.friday'),
    6: t('scheduling.saturday'),
  };

  const handleSave = async (values: any) => {
    const payload: Partial<DoctorSchedule> = {
      doctorId: doctorId!,
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime.format('HH:mm'),
      endTime: values.endTime.format('HH:mm'),
      breakStart: values.breakStart ? values.breakStart.format('HH:mm') : undefined,
      breakEnd: values.breakEnd ? values.breakEnd.format('HH:mm') : undefined,
      slotDuration: values.slotDuration,
      isActive: values.isActive ?? true,
    };

    try {
      if (editingId) {
        await updateSchedule.mutateAsync({ id: editingId, data: payload });
        message.success(t('scheduling.scheduleUpdated'));
      } else {
        await createSchedule.mutateAsync(payload);
        message.success(t('scheduling.scheduleAdded'));
      }
      setModalOpen(false);
      setEditingId(null);
      form.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('scheduling.scheduleSaveError'));
    }
  };

  const handleEdit = (record: DoctorSchedule) => {
    setEditingId(record.id);
    form.setFieldsValue({
      dayOfWeek: record.dayOfWeek,
      startTime: dayjs(record.startTime, 'HH:mm'),
      endTime: dayjs(record.endTime, 'HH:mm'),
      breakStart: record.breakStart ? dayjs(record.breakStart, 'HH:mm') : null,
      breakEnd: record.breakEnd ? dayjs(record.breakEnd, 'HH:mm') : null,
      slotDuration: record.slotDuration || 30,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await schedulesService.remove(id);
      message.success(t('scheduling.scheduleDeleted'));
      refetch();
    } catch {
      message.error(t('scheduling.scheduleDeleteError'));
    }
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ slotDuration: 30, isActive: true });
    setModalOpen(true);
  };

  const columns = [
    {
      title: t('scheduling.day'), dataIndex: 'dayOfWeek', key: 'dayOfWeek', width: 140,
      sorter: (a: DoctorSchedule, b: DoctorSchedule) => a.dayOfWeek - b.dayOfWeek,
      render: (d: number) => <Tag color="blue">{dayNames[d]}</Tag>,
    },
    {
      title: t('scheduling.workingHours'), key: 'time', width: 160,
      render: (_: unknown, r: DoctorSchedule) => (
        <span><ClockCircleOutlined style={{ marginRight: 6, color: 'var(--primary-500)' }} />{r.startTime} — {r.endTime}</span>
      ),
    },
    {
      title: t('scheduling.break'), key: 'break', width: 140,
      render: (_: unknown, r: DoctorSchedule) =>
        r.breakStart && r.breakEnd ? `${r.breakStart} — ${r.breakEnd}` : '—',
    },
    {
      title: t('scheduling.slotDuration'), dataIndex: 'slotDuration', key: 'slotDuration', width: 110,
      render: (v: number) => <Tag color="green">{v} {t('billing.min')}</Tag>,
    },
    {
      title: t('common.status'), dataIndex: 'isActive', key: 'isActive', width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('scheduling.activeStatus') : t('scheduling.offStatus')}</Tag>,
    },
    {
      title: '', key: 'actions', width: 90,
      render: (_: unknown, r: DoctorSchedule) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
          <Popconfirm title={t('scheduling.deleteScheduleConfirm')} onConfirm={() => handleDelete(r.id)} okText={t('common.yes')} cancelText={t('common.no')}>
            <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: 'var(--danger-500)' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><SettingOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('scheduling.doctorScheduleSettings')}</h2>
        <Space>
          {isAdmin && (
            <Select
              placeholder={t('scheduling.selectDoctor')}
              style={{ minWidth: 200 }}
              value={selectedDoctorId}
              onChange={setSelectedDoctorId}
              allowClear
              showSearch
              optionFilterProp="label"
              options={doctors.map((d: any) => ({
                value: d.id,
                label: `${d.lastName} ${d.firstName} ${d.specialty ? `(${d.specialty})` : ''}`,
              }))}
            />
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('scheduling.addDay')}
          </Button>
        </Space>
      </div>

      <div className="modern-card">
        <div className="modern-card-body">
          {!doctorId ? (
            <Empty description={t('scheduling.selectDoctorForSchedule')} />
          ) : (
            <Table
              columns={columns}
              dataSource={Array.isArray(schedules) ? schedules : []}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              size="middle"
              scroll={{ x: 750 }}
              locale={{ emptyText: <Empty description={t('scheduling.scheduleNotConfigured')} /> }}
            />
          )}
        </div>
      </div>

      <Modal
        title={editingId ? t('scheduling.editSchedule') : t('scheduling.addWorkDay')}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingId(null); form.resetFields(); }}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="dayOfWeek" label={t('scheduling.dayOfWeek')} rules={[{ required: true, message: t('scheduling.selectDay') }]}>
            <Select placeholder={t('scheduling.selectDay')} options={
              [1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: d, label: dayNames[d] }))
            } />
          </Form.Item>

          <Space size={12} style={{ width: '100%' }}>
            <Form.Item name="startTime" label={t('scheduling.startTime')} rules={[{ required: true, message: t('scheduling.specifyTime') }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} placeholder="08:00" />
            </Form.Item>
            <Form.Item name="endTime" label={t('scheduling.endTime')} rules={[{ required: true, message: t('scheduling.specifyTime') }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} placeholder="17:00" />
            </Form.Item>
          </Space>

          <Space size={12} style={{ width: '100%' }}>
            <Form.Item name="breakStart" label={t('scheduling.breakFrom')} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} placeholder="12:00" />
            </Form.Item>
            <Form.Item name="breakEnd" label={t('scheduling.breakTo')} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} placeholder="13:00" />
            </Form.Item>
          </Space>

          <Form.Item name="slotDuration" label={t('scheduling.slotDurationLabel')} rules={[{ required: true }]}>
            <Select options={slotOptions.map((o) => ({ ...o, label: `${o.label} ${t('billing.min')}` }))} />
          </Form.Item>

          <Form.Item name="isActive" label={t('scheduling.activeStatus')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalOpen(false); setEditingId(null); }}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={createSchedule.isPending || updateSchedule.isPending}>
                {editingId ? t('common.save') : t('scheduling.add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorSettingsPage;

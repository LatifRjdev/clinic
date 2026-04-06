import React, { useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  Row,
  Col,
  Descriptions,
  Input,
  Empty,
  Spin,
  Timeline,
  message,
} from 'antd';
import {
  CalendarOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  UserOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';
import { useAppointments, useDoctors, useCreateAppointment, useSlots } from '../../hooks/useAppointments';
import { useMedicalRecords } from '../../hooks/useEmr';
import { useInvoices } from '../../hooks/useBilling';
import type { Appointment, MedicalRecord, Invoice } from '../../types';
import { formatCurrency } from '../../utils/format';

const { TabPane } = Tabs;

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  bg: string;
}> = ({ icon, title, value, color, bg }) => (
  <Card
    style={{
      borderRadius: 16,
      border: 'none',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}
    bodyStyle={{ padding: '20px 24px' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  </Card>
);

/* ------------------------------------------------------------------ */
/*  My Appointments Tab                                                */
/* ------------------------------------------------------------------ */
const MyAppointmentsTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useAppointments({ patientId });

  const appointments: Appointment[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  const upcoming = appointments.filter(
    (a) => ['scheduled', 'confirmed'].includes(a.status) && dayjs(a.date).isAfter(dayjs().subtract(1, 'day')),
  );
  const past = appointments.filter(
    (a) => ['completed', 'cancelled', 'no_show'].includes(a.status) || dayjs(a.date).isBefore(dayjs()),
  );

  const statusColor: Record<string, string> = {
    scheduled: 'blue',
    confirmed: 'cyan',
    in_progress: 'orange',
    completed: 'green',
    cancelled: 'red',
    no_show: 'default',
  };

  const columns = [
    {
      title: t('scheduling.date'),
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY'),
    },
    {
      title: t('scheduling.time'),
      key: 'time',
      render: (_: unknown, r: Appointment) => `${r.startTime} - ${r.endTime}`,
    },
    {
      title: t('scheduling.doctor'),
      key: 'doctor',
      render: (_: unknown, r: Appointment) =>
        r.doctor ? `${r.doctor.lastName} ${r.doctor.firstName}` : '-',
    },
    {
      title: t('scheduling.type'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => t(`scheduling.${v === 'follow_up' ? 'followUp' : v}`, v),
    },
    {
      title: t('scheduling.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusColor[s] || 'default'}>{t(`scheduling.${s === 'in_progress' ? 'inProgress' : s === 'no_show' ? 'noShow' : s}`, s)}</Tag>
      ),
    },
  ];

  if (isLoading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>
          <ScheduleOutlined style={{ marginRight: 8 }} />
          {t('portal.upcomingAppointments')}
        </h3>
        {upcoming.length === 0 ? (
          <Empty description={t('portal.noUpcoming')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={upcoming}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="middle"
            style={{ borderRadius: 12, overflow: 'hidden' }}
          />
        )}
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          {t('portal.pastAppointments')}
        </h3>
        {past.length === 0 ? (
          <Empty description={t('portal.noPast')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={past}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5, size: 'small' }}
            size="middle"
            style={{ borderRadius: 12, overflow: 'hidden' }}
          />
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Book Appointment Tab                                               */
/* ------------------------------------------------------------------ */
const BookAppointmentTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { data: doctorsList } = useDoctors();
  const createAppointment = useCreateAppointment();

  const selectedDoctorId = Form.useWatch('doctorId', form);
  const selectedDate = Form.useWatch('date', form);
  const dateStr = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : '';

  const { data: slotsData, isLoading: slotsLoading } = useSlots(
    selectedDoctorId || '',
    dateStr,
  );

  const slots: string[] = useMemo(() => {
    if (!slotsData) return [];
    return Array.isArray(slotsData) ? slotsData : [];
  }, [slotsData]);

  const handleBook = async (values: any) => {
    try {
      await createAppointment.mutateAsync({
        patientId,
        doctorId: values.doctorId,
        date: dayjs(values.date).format('YYYY-MM-DD'),
        startTime: values.timeSlot,
        endTime: '', // backend calculates from slot duration
        type: 'primary',
        source: 'online',
        notes: values.notes || '',
      });
      message.success(t('portal.appointmentBooked'));
      form.resetFields();
    } catch {
      message.error(t('portal.appointmentBookError'));
    }
  };

  return (
    <Card
      style={{ borderRadius: 16, maxWidth: 600 }}
      bodyStyle={{ padding: 24 }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--gray-700)' }}>
        <PlusOutlined style={{ marginRight: 8 }} />
        {t('portal.bookNewAppointment')}
      </h3>
      <Form form={form} layout="vertical" onFinish={handleBook}>
        <Form.Item
          name="doctorId"
          label={t('scheduling.doctor')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Select
            placeholder={t('scheduling.selectDoctor')}
            showSearch
            optionFilterProp="label"
            options={(doctorsList || []).map((d: any) => ({
              value: d.id,
              label: `${d.lastName} ${d.firstName}${d.specialty ? ` — ${d.specialty}` : ''}`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="date"
          label={t('scheduling.date')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            format="DD.MM.YYYY"
          />
        </Form.Item>
        <Form.Item
          name="timeSlot"
          label={t('portal.timeSlot')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Select
            placeholder={t('portal.selectTimeSlot')}
            loading={slotsLoading}
            disabled={!selectedDoctorId || !selectedDate}
            options={slots.map((s: string) => ({ value: s, label: s }))}
            notFoundContent={
              selectedDoctorId && selectedDate
                ? t('portal.noAvailableSlots')
                : t('portal.selectDoctorAndDate')
            }
          />
        </Form.Item>
        <Form.Item name="notes" label={t('portal.notes')}>
          <Input.TextArea rows={3} placeholder={t('portal.notesPlaceholder')} />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={createAppointment.isPending}
            icon={<CalendarOutlined />}
            size="large"
            style={{ borderRadius: 10 }}
          >
            {t('portal.bookAppointment')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  Medical Records Tab                                                */
/* ------------------------------------------------------------------ */
const MedicalRecordsTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useMedicalRecords({ patientId });
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const records: MedicalRecord[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  // Only show signed records to patients
  const signedRecords = records.filter((r) => r.status === 'signed');

  if (isLoading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  if (signedRecords.length === 0) {
    return <Empty description={t('portal.noMedicalRecords')} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <>
      <Timeline
        items={signedRecords.map((r) => ({
          color: 'green',
          dot: <CheckCircleOutlined />,
          children: (
            <Card
              size="small"
              style={{ borderRadius: 12, cursor: 'pointer', marginBottom: 8 }}
              bodyStyle={{ padding: '12px 16px' }}
              onClick={() => setSelectedRecord(r)}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>
                    {r.diagnosis || t('portal.nodiagnosis')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {dayjs(r.createdAt).format('DD.MM.YYYY')}
                    {r.diagnosisCode && <Tag style={{ marginLeft: 8 }} color="blue">{r.diagnosisCode}</Tag>}
                  </div>
                </div>
                <Tag color="green">{t('emr.signed')}</Tag>
              </div>
            </Card>
          ),
        }))}
      />

      <Modal
        open={!!selectedRecord}
        onCancel={() => setSelectedRecord(null)}
        footer={null}
        width={640}
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            {t('portal.medicalRecordDetail')}
          </span>
        }
      >
        {selectedRecord && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label={t('common.date')}>
              {dayjs(selectedRecord.createdAt).format('DD.MM.YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label={t('emr.diagnosis')}>
              {selectedRecord.diagnosis}
              {selectedRecord.diagnosisCode && (
                <Tag color="blue" style={{ marginLeft: 8 }}>{selectedRecord.diagnosisCode}</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('emr.complaints')}>
              {selectedRecord.complaints || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('emr.examination')}>
              {selectedRecord.examination || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('emr.recommendations')}>
              {selectedRecord.recommendations || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Invoices Tab                                                       */
/* ------------------------------------------------------------------ */
const InvoicesTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useInvoices({ patientId });

  const invoices: Invoice[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  const statusColor: Record<string, string> = {
    draft: 'default',
    pending: 'orange',
    paid: 'green',
    partially_paid: 'blue',
    cancelled: 'red',
    refunded: 'purple',
  };

  const columns = [
    {
      title: t('portal.invoiceNumber'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v: string) => <span style={{ fontWeight: 600 }}>#{v}</span>,
    },
    {
      title: t('common.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY'),
    },
    {
      title: t('billing.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => formatCurrency(v || 0),
    },
    {
      title: t('billing.discount'),
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (v: number) => (v ? formatCurrency(v) : '-'),
    },
    {
      title: t('billing.finalAmount'),
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (v: number) => (
        <span style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
          {formatCurrency(v || 0)}
        </span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const key = s === 'partially_paid' ? 'partiallyPaid' : s;
        return <Tag color={statusColor[s] || 'default'}>{t(`billing.${key}`, s)}</Tag>;
      },
    },
  ];

  if (isLoading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  if (invoices.length === 0) {
    return <Empty description={t('portal.noInvoices')} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Table
      dataSource={invoices}
      columns={columns}
      rowKey="id"
      pagination={{ pageSize: 10, size: 'small' }}
      size="middle"
      style={{ borderRadius: 12, overflow: 'hidden' }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  Profile Tab                                                        */
/* ------------------------------------------------------------------ */
const ProfileTab: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <Card style={{ borderRadius: 16, maxWidth: 600 }} bodyStyle={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'var(--primary-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--primary-600)',
          }}
        >
          {user.lastName?.charAt(0)}{user.firstName?.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)' }}>
            {user.lastName} {user.firstName} {user.middleName || ''}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            {t(`roles.${user.role}`, user.role)}
          </div>
        </div>
      </div>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label={t('auth.email')}>{user.email}</Descriptions.Item>
        <Descriptions.Item label={t('patients.phone')}>{user.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('profile.language')}>
          {user.preferredLanguage === 'tj' ? 'Tajik' : 'Russian'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

/* ================================================================== */
/*  Main Patient Portal Page                                           */
/* ================================================================== */
const PatientPortalPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // For a patient user, their own patientId should be linked;
  // we use user.id as a fallback — the backend maps patient users to patient records.
  const patientId = (user as any)?.patientId || user?.id || '';

  const { data: appointmentsData } = useAppointments({ patientId });
  const { data: invoicesData } = useInvoices({ patientId });
  const { data: recordsData } = useMedicalRecords({ patientId });

  const appointments: Appointment[] = useMemo(() => {
    if (!appointmentsData) return [];
    return Array.isArray(appointmentsData) ? appointmentsData : appointmentsData.data || [];
  }, [appointmentsData]);

  const invoices: Invoice[] = useMemo(() => {
    if (!invoicesData) return [];
    return Array.isArray(invoicesData) ? invoicesData : invoicesData.data || [];
  }, [invoicesData]);

  const records: MedicalRecord[] = useMemo(() => {
    if (!recordsData) return [];
    return Array.isArray(recordsData) ? recordsData : recordsData.data || [];
  }, [recordsData]);

  const upcomingCount = appointments.filter(
    (a) => ['scheduled', 'confirmed'].includes(a.status) && dayjs(a.date).isAfter(dayjs().subtract(1, 'day')),
  ).length;
  const unpaidCount = invoices.filter((i) => ['pending', 'partially_paid'].includes(i.status)).length;
  const signedRecordsCount = records.filter((r) => r.status === 'signed').length;

  const tabItems = [
    {
      key: 'appointments',
      label: (
        <span><CalendarOutlined style={{ marginRight: 6 }} />{t('portal.myAppointments')}</span>
      ),
      children: <MyAppointmentsTab patientId={patientId} />,
    },
    {
      key: 'book',
      label: (
        <span><PlusOutlined style={{ marginRight: 6 }} />{t('portal.bookAppointment')}</span>
      ),
      children: <BookAppointmentTab patientId={patientId} />,
    },
    {
      key: 'records',
      label: (
        <span><MedicineBoxOutlined style={{ marginRight: 6 }} />{t('portal.myRecords')}</span>
      ),
      children: <MedicalRecordsTab patientId={patientId} />,
    },
    {
      key: 'invoices',
      label: (
        <span><DollarOutlined style={{ marginRight: 6 }} />{t('portal.myInvoices')}</span>
      ),
      children: <InvoicesTab patientId={patientId} />,
    },
    {
      key: 'profile',
      label: (
        <span><UserOutlined style={{ marginRight: 6 }} />{t('portal.myProfile')}</span>
      ),
      children: <ProfileTab />,
    },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Welcome Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-800)', margin: 0 }}>
          {t('portal.welcome')}, {user?.firstName || ''}!
        </h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, marginTop: 4 }}>
          {t('portal.subtitle')}
        </p>
      </div>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CalendarOutlined />}
            title={t('portal.upcomingAppointments')}
            value={upcomingCount}
            color="var(--primary-600)"
            bg="var(--primary-50)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            title={t('portal.totalVisits')}
            value={appointments.length}
            color="#10b981"
            bg="#ecfdf5"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<MedicineBoxOutlined />}
            title={t('portal.medicalRecords')}
            value={signedRecordsCount}
            color="#8b5cf6"
            bg="#f5f3ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<DollarOutlined />}
            title={t('portal.unpaidInvoices')}
            value={unpaidCount}
            color={unpaidCount > 0 ? '#ef4444' : '#10b981'}
            bg={unpaidCount > 0 ? '#fef2f2' : '#ecfdf5'}
          />
        </Col>
      </Row>

      {/* Tabs */}
      <Card
        style={{
          borderRadius: 20,
          border: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
        bodyStyle={{ padding: '8px 24px 24px' }}
      >
        <Tabs defaultActiveKey="appointments" items={tabItems} size="large" />
      </Card>
    </div>
  );
};

export default PatientPortalPage;

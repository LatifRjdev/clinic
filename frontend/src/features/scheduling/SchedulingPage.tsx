import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Segmented,
  Avatar,
  Tooltip,
  message,
} from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
  UserSwitchOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MedicineBoxOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  useAppointments,
  useCreateAppointment,
  useChangeAppointmentStatus,
  useAppointmentServices,
  useAddAppointmentServices,
  useRemoveAppointmentService,
  useSlots,
  useRescheduleAppointment,
} from '../../hooks/useAppointments';
import { usePatientSearch } from '../../hooks/usePatients';
import { useServices, useCreateInvoice } from '../../hooks/useBilling';
import { useDoctors } from '../../hooks/useAppointments';
import { appointmentsService } from '../../api/services/scheduling.service';
import { useAuthStore } from '../../store/authStore';
import type { Appointment, Service } from '../../types';
import { formatCurrency } from '../../utils/format';

const statusClassMap: Record<string, string> = {
  scheduled: 'scheduled',
  waiting_confirmation: 'scheduled',
  confirmed: 'confirmed',
  in_progress: 'in-progress',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'cancelled',
};

const SchedulingPage: React.FC = () => {
  const { t } = useTranslation();

  const statusMap: Record<string, string> = {
    scheduled: t('scheduling.scheduled'),
    waiting_confirmation: t('scheduling.waitingConfirmation'),
    confirmed: t('scheduling.confirmed'),
    in_progress: t('scheduling.inProgress'),
    completed: t('scheduling.completed'),
    cancelled: t('scheduling.cancelled'),
    no_show: t('scheduling.noShow'),
  };
  const { user } = useAuthStore();
  const role = user?.role || 'doctor';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [servicesAppointmentId, setServicesAppointmentId] = useState<string | null>(null);
  const [selectedServiceItems, setSelectedServiceItems] = useState<{ serviceId: string; quantity: number }[]>([]);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInPatientSearch, setWalkInPatientSearch] = useState('');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [view, setView] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs>(dayjs());
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);
  const [patientSearch, setPatientSearch] = useState('');
  const [slotDoctorId, setSlotDoctorId] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const { data: availableSlots } = useSlots(slotDoctorId, slotDate);
  const { data: rescheduleSlots } = useSlots(
    rescheduleAppointment?.doctorId || '',
    rescheduleDate,
  );
  const rescheduleAppointmentMutation = useRescheduleAppointment();
  const [form] = Form.useForm();
  const [walkInForm] = Form.useForm();
  const navigate = useNavigate();

  const [pickedDate, setPickedDate] = useState<dayjs.Dayjs | null>(null);

  const dateFilters = useMemo(() => {
    // If user picked a specific date in DatePicker — always filter by that date
    if (pickedDate) {
      const d = pickedDate.format('YYYY-MM-DD');
      return { dateFrom: d, dateTo: d };
    }
    if (view === 'today') {
      const today = dayjs().format('YYYY-MM-DD');
      return { dateFrom: today, dateTo: today };
    }
    if (view === 'week') {
      return {
        dateFrom: filterDate.startOf('week').format('YYYY-MM-DD'),
        dateTo: filterDate.endOf('week').format('YYYY-MM-DD'),
      };
    }
    if (view === 'month') {
      return {
        dateFrom: filterDate.startOf('month').format('YYYY-MM-DD'),
        dateTo: filterDate.endOf('month').format('YYYY-MM-DD'),
      };
    }
    // 'all' without picked date — show wide range
    return {
      dateFrom: dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
      dateTo: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    };
  }, [view, filterDate, pickedDate]);

  const { data: apptData, isLoading } = useAppointments({
    ...dateFilters,
    doctorId: selectedDoctor,
    status: statusFilter,
    limit: 500,
  });
  const { data: searchedPatients } = usePatientSearch(patientSearch);
  const createAppointment = useCreateAppointment();
  const changeStatus = useChangeAppointmentStatus();
  const createInvoice = useCreateInvoice();
  const { data: searchedWalkInPatients } = usePatientSearch(walkInPatientSearch);
  const { data: doctorUsers = [] } = useDoctors();
  const { data: allServicesData } = useServices({ isActive: true, limit: 200 });
  const allServicesList: Service[] = allServicesData?.data || [];
  const { data: renderedServices } = useAppointmentServices(servicesAppointmentId || '');
  const addServices = useAddAppointmentServices();
  const removeServiceRecord = useRemoveAppointmentService();

  const appointments = apptData?.data || (Array.isArray(apptData) ? apptData : []);

  const filteredAppointments = selectedDoctor
    ? appointments.filter((a: Appointment) => a.doctorId === selectedDoctor)
    : appointments;

  // Collect unique doctors from appointments
  const doctorsMap = new Map<string, { id: string; name: string; color: string }>();
  const docColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];
  appointments.forEach((a: Appointment, i: number) => {
    if (a.doctor && !doctorsMap.has(a.doctorId)) {
      doctorsMap.set(a.doctorId, {
        id: a.doctorId,
        name: `${a.doctor.lastName} ${a.doctor.firstName?.charAt(0)}.`,
        color: docColors[i % docColors.length],
      });
    }
  });
  const doctors = Array.from(doctorsMap.values());

  const typeLabels: Record<string, string> = {
    primary: t('scheduling.primary'),
    follow_up: t('scheduling.followUp'),
    procedure: t('scheduling.procedure'),
    consultation: t('scheduling.consultation'),
  };

  // Role-based action visibility
  const canConfirm = ['owner', 'sysadmin', 'chief_doctor', 'admin', 'reception'].includes(role);
  const canMarkArrived = ['owner', 'sysadmin', 'chief_doctor', 'admin', 'reception', 'nurse'].includes(role);
  const canComplete = ['owner', 'sysadmin', 'chief_doctor', 'doctor'].includes(role);
  const canStartExam = ['owner', 'sysadmin', 'chief_doctor', 'doctor'].includes(role);
  const canCancel = ['owner', 'sysadmin', 'chief_doctor', 'admin', 'reception'].includes(role);
  const canMarkNoShow = ['owner', 'sysadmin', 'chief_doctor', 'admin', 'reception'].includes(role);

  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    changeStatus.mutate(
      { id, status, cancellationReason: reason },
      {
        onSuccess: () => {
          message.success(t('common.success'));
        },
        onError: (err: any) => message.error(err?.response?.data?.message || t('common.error')),
      },
    );
  };

  const handleCompleteAppointment = async (id: string) => {
    let serviceItems: any[] = [];
    let totalAmount = 0;
    const appointment = appointments.find((a) => a.id === id);

    try {
      const services = await appointmentsService.getServices(id);
      serviceItems = Array.isArray(services) ? services : services?.data || [];
      totalAmount = serviceItems.reduce(
        (sum: number, s: any) => sum + (s.unitPrice || 0) * (s.quantity || 1),
        0,
      );
    } catch {
      // proceed without services
    }

    let selectedPayment = 'cash';

    Modal.confirm({
      title: t('scheduling.completeConfirmTitle'),
      width: 480,
      content: (
        <div>
          <p>{t('scheduling.completeConfirmBody')}</p>
          {serviceItems.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {serviceItems.map((s: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span>{s.serviceName || s.name} x{s.quantity || 1}</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCurrency((s.unitPrice || 0) * (s.quantity || 1))}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 8, paddingTop: 8, fontWeight: 700, textAlign: 'right' }}>
                {t('scheduling.totalAmount')}: {formatCurrency(totalAmount)}
              </div>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t('scheduling.paymentMethod')}</div>
            <Select
              defaultValue="cash"
              style={{ width: '100%' }}
              onChange={(val: string) => { selectedPayment = val; }}
              options={[
                { value: 'cash', label: t('scheduling.paymentCash') },
                { value: 'card', label: t('scheduling.paymentCard') },
                { value: 'transfer', label: t('scheduling.paymentTransfer') },
              ]}
            />
          </div>
        </div>
      ),
      okText: t('scheduling.complete'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        // First create invoice, then change status
        if (serviceItems.length > 0 && totalAmount > 0 && appointment?.patientId) {
          try {
            await new Promise<void>((resolve, reject) => {
              createInvoice.mutate(
                {
                  patientId: appointment.patientId,
                  appointmentId: id,
                  totalAmount,
                  finalAmount: totalAmount,
                  status: 'pending',
                  paymentMethod: selectedPayment,
                  items: serviceItems.map((s: any) => ({
                    serviceId: s.serviceId,
                    name: s.serviceName || s.name,
                    quantity: s.quantity || 1,
                    unitPrice: s.unitPrice || 0,
                    amount: (s.unitPrice || 0) * (s.quantity || 1),
                  })),
                } as any,
                {
                  onSuccess: () => {
                    message.success(t('scheduling.invoiceAutoCreated'));
                    resolve();
                  },
                  onError: (err: any) => {
                    reject(err);
                  },
                },
              );
            });
          } catch {
            message.error(t('scheduling.invoiceCreationFailed'));
            throw new Error('Invoice creation failed');
          }
        }
        // Only change status after invoice is created successfully
        handleStatusChange(id, 'completed');
      },
    });
  };

  const openCancelModal = (id: string) => {
    setCancellingId(id);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const confirmCancel = () => {
    if (!cancellingId || !cancelReason.trim()) {
      message.warning(t('scheduling.cancelReasonRequired'));
      return;
    }
    handleStatusChange(cancellingId, 'cancelled', cancelReason.trim());
    setCancelModalOpen(false);
    setCancellingId(null);
    setCancelReason('');
  };

  const openServicesModal = (appointmentId: string) => {
    setServicesAppointmentId(appointmentId);
    setSelectedServiceItems([]);
    setServicesModalOpen(true);
  };

  const handleAddServiceItem = () => {
    setSelectedServiceItems((prev) => [...prev, { serviceId: '', quantity: 1 }]);
  };

  const handleSaveServices = async () => {
    const validItems = selectedServiceItems.filter((i) => i.serviceId);
    if (validItems.length === 0) {
      message.warning(t('scheduling.addService'));
      return;
    }
    try {
      await addServices.mutateAsync({
        appointmentId: servicesAppointmentId!,
        items: validItems,
        recordedBy: user?.id || '',
      });
      message.success(t('common.success'));
      setSelectedServiceItems([]);
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleRemoveRendered = async (serviceRecordId: string) => {
    try {
      await removeServiceRecord.mutateAsync({
        appointmentId: servicesAppointmentId!,
        serviceRecordId,
      });
      message.success(t('common.success'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleWalkIn = async (values: Record<string, unknown>) => {
    try {
      const now = dayjs();
      const endTime = now.add(30, 'minute');
      await createAppointment.mutateAsync({
        patientId: values.patientId as string,
        doctorId: values.doctorId as string,
        date: now.format('YYYY-MM-DD'),
        startTime: now.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        type: (values.type as string) || 'primary',
        source: 'walk_in',
        status: 'in_progress',
        notes: values.notes as string,
      } as any);
      message.success(t('scheduling.appointmentCreated'));
      setWalkInModalOpen(false);
      walkInForm.resetFields();
    } catch {
      message.error(t('scheduling.appointmentError'));
    }
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleDate('');
    setRescheduleSlot(null);
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleAppointment || !rescheduleDate || !rescheduleSlot) {
      message.warning(t('scheduling.selectTimeSlot'));
      return;
    }
    try {
      await rescheduleAppointmentMutation.mutateAsync({
        id: rescheduleAppointment.id,
        date: rescheduleDate,
        startTime: rescheduleSlot.startTime,
        endTime: rescheduleSlot.endTime,
      });
      message.success(t('scheduling.rescheduleSuccess'));
      setRescheduleModalOpen(false);
      setRescheduleAppointment(null);
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      const dateVal = values.date as { format: (f: string) => string };
      await createAppointment.mutateAsync({
        patientId: values.patientId as string,
        doctorId: values.doctorId as string,
        date: dateVal.format('YYYY-MM-DD'),
        startTime: values.startTime as string,
        endTime: values.endTime as string,
        type: values.type as string,
        notes: values.notes as string,
      });
      message.success(t('scheduling.appointmentCreated'));
      setIsModalOpen(false);
      form.resetFields();
    } catch {
      message.error(t('scheduling.appointmentError'));
    }
  };

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 50,
      render: (_: unknown, __: Appointment, index: number) => (
        <span style={{ fontWeight: 500, color: 'var(--gray-400)' }}>{index + 1}</span>
      ),
    },
    {
      title: t('scheduling.time'),
      key: 'time',
      width: 160,
      render: (_: unknown, record: Appointment) => (
        <div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            {record.date ? dayjs(record.date).format('DD.MM.YYYY') : ''}
          </div>
          <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
            {record.startTime?.slice(0, 5)}–{record.endTime?.slice(0, 5)}
          </span>
        </div>
      ),
    },
    {
      title: t('scheduling.patient'),
      key: 'patient',
      render: (_: unknown, record: Appointment) => {
        const name = record.patient
          ? `${record.patient.lastName} ${record.patient.firstName?.charAt(0)}.`
          : '';
        return name ? (
          <Space
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/patients?highlight=${record.patientId}`)}
          >
            <Avatar size="small" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
              {name.charAt(0)}
            </Avatar>
            <span style={{ fontWeight: 500, color: 'var(--primary-500)' }}>{name}</span>
          </Space>
        ) : (
          <span style={{ color: 'var(--gray-300)' }}>—</span>
        );
      },
    },
    {
      title: t('scheduling.doctor'),
      key: 'doctor',
      render: (_: unknown, record: Appointment) =>
        record.doctor ? `${record.doctor.lastName} ${record.doctor.firstName?.charAt(0)}.` : '',
    },
    {
      title: t('scheduling.type'),
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => type ? (
        <span style={{ color: 'var(--gray-600)', fontSize: 13 }}>{typeLabels[type] || type}</span>
      ) : <span style={{ color: 'var(--gray-300)' }}>--</span>,
    },
    {
      title: t('scheduling.status'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <span className={`status-badge ${statusClassMap[status] || ''}`}>{statusMap[status] || status}</span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Appointment) => (
        <Space size={4}>
          {/* reschedule: scheduled/confirmed → new date/time */}
          {['scheduled', 'confirmed'].includes(record.status) && canConfirm && (
            <Tooltip title={t('scheduling.reschedule')}>
              <Button
                size="small"
                style={{ background: '#0ea5e9', color: 'white', border: 'none' }}
                icon={<SwapOutlined />}
                onClick={() => openRescheduleModal(record)}
              />
            </Tooltip>
          )}

          {/* confirm: scheduled → confirmed */}
          {['scheduled', 'waiting_confirmation'].includes(record.status) && canConfirm && (
            <Tooltip title={t('scheduling.confirm')}>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, 'confirmed')}
              />
            </Tooltip>
          )}

          {/* arrived: confirmed → in_progress */}
          {record.status === 'confirmed' && canMarkArrived && (
            <Tooltip title={t('scheduling.arrived')}>
              <Button
                size="small"
                style={{ background: '#10b981', color: 'white', border: 'none' }}
                icon={<UserSwitchOutlined />}
                onClick={() => handleStatusChange(record.id, 'in_progress')}
              />
            </Tooltip>
          )}

          {/* start exam: confirmed/in_progress → EMR */}
          {['confirmed', 'in_progress'].includes(record.status) && canStartExam && (
            <Tooltip title={t('scheduling.startExam')}>
              <Button
                size="small"
                style={{ background: '#8b5cf6', color: 'white', border: 'none' }}
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/emr?appointmentId=${record.id}&patientId=${record.patientId}`)}
              />
            </Tooltip>
          )}

          {/* services: in_progress / completed */}
          {['in_progress', 'completed'].includes(record.status) && canStartExam && (
            <Tooltip title={t('scheduling.servicesRendered')}>
              <Button
                size="small"
                style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                icon={<MedicineBoxOutlined />}
                onClick={() => openServicesModal(record.id)}
              />
            </Tooltip>
          )}

          {/* complete: in_progress → completed */}
          {record.status === 'in_progress' && canComplete && (
            <Tooltip title={t('scheduling.complete')}>
              <Button
                size="small"
                style={{ background: '#059669', color: 'white', border: 'none' }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleCompleteAppointment(record.id)}
              />
            </Tooltip>
          )}

          {/* no_show: scheduled/confirmed → no_show */}
          {['scheduled', 'waiting_confirmation', 'confirmed'].includes(record.status) && canMarkNoShow && (
            <Tooltip title={t('scheduling.markNoShow')}>
              <Button
                size="small"
                style={{ background: '#6b7280', color: 'white', border: 'none' }}
                icon={<StopOutlined />}
                onClick={() => handleStatusChange(record.id, 'no_show')}
              />
            </Tooltip>
          )}

          {/* cancel: scheduled/confirmed/in_progress → cancelled */}
          {['scheduled', 'waiting_confirmation', 'confirmed', 'in_progress'].includes(record.status) && canCancel && (
            <Tooltip title={t('scheduling.cancel')}>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => openCancelModal(record.id)}
              />
            </Tooltip>
          )}

          {/* invoices: completed → view invoices */}
          {record.status === 'completed' && (
            <Tooltip title={t('nav.invoices')}>
              <Button
                size="small"
                style={{ background: '#6366f1', color: 'white', border: 'none' }}
                icon={<DollarOutlined />}
                onClick={() => navigate(`/billing/invoices?patientId=${record.patientId}`)}
              />
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
            <CalendarOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
            {t('scheduling.title')}
          </h2>
          <p className="page-header-subtitle">
            {dayjs().format('dddd, D MMMM YYYY')}
          </p>
        </div>
        <Space wrap>
          {canConfirm && (
            <Button
              icon={<ThunderboltOutlined />}
              style={{ background: '#f59e0b', color: 'white', border: 'none', fontWeight: 600 }}
              onClick={() => setWalkInModalOpen(true)}
            >
              {t('scheduling.walkIn')}
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            {t('scheduling.newAppointment')}
          </Button>
        </Space>
      </div>

      <div className="modern-card" style={{ marginBottom: 24 }}>
        <div className="modern-card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Segmented
              options={[
                { value: 'all', label: t('scheduling.all') },
                { value: 'today', label: t('scheduling.today') },
                { value: 'week', label: t('scheduling.week') },
                { value: 'month', label: t('scheduling.month') },
              ]}
              value={view}
              onChange={(val) => setView(val as string)}
            />
            <DatePicker value={pickedDate} onChange={(d) => { setPickedDate(d); if (d) setFilterDate(d); }} allowClear placeholder={t('common.date')} style={{ borderRadius: 'var(--radius-md)' }} />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              placeholder={t('common.status')}
              style={{ minWidth: 180 }}
              options={[
                { value: 'scheduled', label: t('scheduling.scheduled') },
                { value: 'waiting_confirmation', label: t('scheduling.waitingConfirmation') },
                { value: 'confirmed', label: t('scheduling.confirmed') },
                { value: 'in_progress', label: t('scheduling.inProgress') },
                { value: 'completed', label: t('scheduling.completed') },
                { value: 'cancelled', label: t('scheduling.cancelled') },
                { value: 'no_show', label: t('scheduling.noShow') },
              ]}
            />
          </div>

          {doctors.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <Tooltip title={t('scheduling.allDoctors')}>
                <div
                  onClick={() => setSelectedDoctor(undefined)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 99, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500,
                    background: !selectedDoctor ? 'var(--primary-500)' : 'var(--gray-100)',
                    color: !selectedDoctor ? '#fff' : 'var(--gray-600)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {t('scheduling.all')}
                </div>
              </Tooltip>
              {doctors.map((doc) => (
                <Tooltip key={doc.id} title={doc.name}>
                  <div
                    onClick={() => setSelectedDoctor(doc.id === selectedDoctor ? undefined : doc.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '4px 14px 4px 4px', borderRadius: 99, cursor: 'pointer',
                      fontSize: 13, fontWeight: 500,
                      background: selectedDoctor === doc.id ? doc.color : 'var(--gray-100)',
                      color: selectedDoctor === doc.id ? '#fff' : 'var(--gray-700)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <Avatar
                      size={28}
                      style={{
                        background: selectedDoctor === doc.id ? 'rgba(255,255,255,0.3)' : doc.color,
                        color: '#fff', fontSize: 12,
                      }}
                    >
                      {doc.name.charAt(0)}
                    </Avatar>
                    {doc.name}
                  </div>
                </Tooltip>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)' }}>
              {t('scheduling.totalAppointments', 'Всего записей')}: <span style={{ color: 'var(--primary-600)', fontSize: 16 }}>{filteredAppointments.length}</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              {dateFilters.dateFrom === dateFilters.dateTo
                ? dayjs(dateFilters.dateFrom).format('DD.MM.YYYY')
                : `${dayjs(dateFilters.dateFrom).format('DD.MM')} — ${dayjs(dateFilters.dateTo).format('DD.MM.YYYY')}`}
            </span>
          </div>
          <Table
            columns={columns}
            dataSource={filteredAppointments.map((a: Appointment) => ({ ...a, key: a.id }))}
            pagination={filteredAppointments.length > 50 ? { pageSize: 50, showTotal: (total) => `${t('common.total')}: ${total}` } : false}
            size="middle"
            loading={isLoading}
            scroll={{ x: 1000 }}
            locale={{ emptyText: t('common.noData') }}
            style={{ borderRadius: 'var(--radius-lg)' }}
          />
        </div>
      </div>

      {/* Create Appointment Modal */}
      <Modal
        title={t('scheduling.newAppointment')}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setSlotDoctorId(''); setSlotDate(''); }}
        onOk={() => form.submit()}
        confirmLoading={createAppointment.isPending}
        width={640}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="patientId" label={t('scheduling.patient')} rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder={t('patients.search')}
                  filterOption={false}
                  onSearch={(v) => setPatientSearch(v)}
                  options={(searchedPatients || []).map((p) => ({
                    value: p.id,
                    label: `${p.lastName} ${p.firstName} ${p.middleName || ''}`.trim(),
                  }))}
                  notFoundContent={patientSearch.length < 2 ? t('common.searchMinChars') : t('common.nothingFound')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="doctorId" label={t('scheduling.doctor')} rules={[{ required: true }]}>
                <Select
                  options={doctors.map((d) => ({ value: d.id, label: d.name }))}
                  placeholder={t('scheduling.selectDoctor')}
                  onChange={(v) => { setSlotDoctorId(v); form.setFieldsValue({ startTime: undefined, endTime: undefined }); }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="date" label={t('scheduling.date')} rules={[{ required: true }]}>
                <DatePicker
                  style={{ width: '100%' }}
                  onChange={(d) => { setSlotDate(d ? d.format('YYYY-MM-DD') : ''); form.setFieldsValue({ startTime: undefined, endTime: undefined }); }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item name="startTime" label={t('scheduling.startTime')} rules={[{ required: true }]}>
                <Select
                  placeholder="--:--"
                  disabled={!availableSlots?.length}
                  options={(availableSlots || []).map((s: any) => ({
                    value: s.startTime.slice(0, 5),
                    label: s.startTime.slice(0, 5),
                    disabled: !s.available,
                  }))}
                  onChange={(v: string) => {
                    const slot = (availableSlots || []).find((s: any) => s.startTime.slice(0, 5) === v);
                    if (slot) form.setFieldsValue({ endTime: slot.endTime.slice(0, 5) });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item
                name="endTime"
                label={t('scheduling.endTime')}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || !getFieldValue('startTime') || value > getFieldValue('startTime')) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('scheduling.endTime') + ' > ' + t('scheduling.startTime')));
                    },
                  }),
                ]}
              >
                <Select
                  placeholder="--:--"
                  disabled={!availableSlots?.length}
                  options={(availableSlots || []).map((s: any) => ({
                    value: s.endTime.slice(0, 5),
                    label: s.endTime.slice(0, 5),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="type" label={t('scheduling.type')} rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'primary', label: t('scheduling.primary') },
                    { value: 'follow_up', label: t('scheduling.followUp') },
                    { value: 'procedure', label: t('scheduling.procedure') },
                    { value: 'consultation', label: t('scheduling.consultation') },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t('patients.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Cancel Reason Modal */}
      <Modal
        title={t('scheduling.cancelReason')}
        open={cancelModalOpen}
        onCancel={() => { setCancelModalOpen(false); setCancellingId(null); }}
        onOk={confirmCancel}
        okText={t('scheduling.cancelAppointment')}
        cancelText={t('common.back')}
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder={t('scheduling.cancelReasonRequired')}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Walk-in Modal */}
      <Modal
        title={<><ThunderboltOutlined style={{ color: '#f59e0b', marginRight: 8 }} />{t('scheduling.walkInTitle')}</>}
        open={walkInModalOpen}
        onCancel={() => { setWalkInModalOpen(false); walkInForm.resetFields(); }}
        onOk={() => walkInForm.submit()}
        confirmLoading={createAppointment.isPending}
        width={520}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={walkInForm} layout="vertical" onFinish={handleWalkIn}>
          <Form.Item name="patientId" label={t('scheduling.patient')} rules={[{ required: true, message: t('scheduling.selectPatient') }]}>
            <Select
              showSearch
              placeholder={t('patients.search')}
              filterOption={false}
              onSearch={(v) => setWalkInPatientSearch(v)}
              options={(searchedWalkInPatients || []).map((p) => ({
                value: p.id,
                label: `${p.lastName} ${p.firstName} ${p.middleName || ''}`.trim(),
              }))}
              notFoundContent={walkInPatientSearch.length < 2 ? t('common.searchMinChars') : t('common.nothingFound')}
            />
          </Form.Item>
          <Form.Item name="doctorId" label={t('scheduling.doctor')} rules={[{ required: true, message: t('scheduling.selectDoctor') }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('scheduling.selectDoctor')}
              options={doctorUsers.map((d) => ({
                value: d.id,
                label: `${d.lastName} ${d.firstName}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="type" label={t('scheduling.type')} initialValue="primary">
            <Select
              options={[
                { value: 'primary', label: t('scheduling.primary') },
                { value: 'follow_up', label: t('scheduling.followUp') },
                { value: 'procedure', label: t('scheduling.procedure') },
                { value: 'consultation', label: t('scheduling.consultation') },
              ]}
            />
          </Form.Item>
          <Form.Item name="notes" label={t('patients.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Services Rendered Modal */}
      <Modal
        title={t('scheduling.servicesRendered')}
        open={servicesModalOpen}
        onCancel={() => { setServicesModalOpen(false); setServicesAppointmentId(null); }}
        footer={null}
        width={640}
      >
        {/* Already added services */}
        {Array.isArray(renderedServices) && renderedServices.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>{t('scheduling.servicesRendered')}</div>
            {renderedServices.map((rs: any) => (
              <div key={rs.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, background: 'var(--gray-50)', marginBottom: 6,
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{rs.service?.name || rs.serviceId}</span>
                  <span style={{ color: 'var(--gray-400)', fontSize: 13, marginLeft: 8 }}>
                    x{rs.quantity} &middot; {formatCurrency(rs.unitPrice)}
                  </span>
                </div>
                <Tooltip title={t('common.delete')}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveRendered(rs.id)}
                  />
                </Tooltip>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, marginTop: 8 }}>
              {t('scheduling.totalAmount')}: {formatCurrency(renderedServices.reduce((sum: number, rs: any) => sum + Number(rs.unitPrice) * rs.quantity, 0))}
            </div>
          </div>
        )}

        {/* Add new services */}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>{t('scheduling.addService')}</div>
        {selectedServiceItems.map((item, idx) => (
          <Row key={idx} gutter={8} style={{ marginBottom: 8 }}>
            <Col xs={24} sm={16}>
              <Select
                style={{ width: '100%' }}
                placeholder={t('scheduling.service')}
                showSearch
                optionFilterProp="label"
                value={item.serviceId || undefined}
                onChange={(val) => {
                  const updated = [...selectedServiceItems];
                  updated[idx] = { ...updated[idx], serviceId: val };
                  setSelectedServiceItems(updated);
                }}
                options={allServicesList.map((s) => ({
                  value: s.id,
                  label: `${s.name} — ${formatCurrency(s.price)}`,
                }))}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Select
                style={{ width: '100%' }}
                value={item.quantity}
                onChange={(val) => {
                  const updated = [...selectedServiceItems];
                  updated[idx] = { ...updated[idx], quantity: val };
                  setSelectedServiceItems(updated);
                }}
                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `x${n}` }))}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setSelectedServiceItems((prev) => prev.filter((_, i) => i !== idx))}
              />
            </Col>
          </Row>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button icon={<PlusOutlined />} onClick={handleAddServiceItem}>
            {t('scheduling.addService')}
          </Button>
          {selectedServiceItems.length > 0 && (
            <Button type="primary" onClick={handleSaveServices} loading={addServices.isPending}>
              {t('common.save')}
            </Button>
          )}
        </div>
      </Modal>

      {/* Reschedule Appointment Modal */}
      <Modal
        title={t('scheduling.reschedule')}
        open={rescheduleModalOpen}
        onCancel={() => { setRescheduleModalOpen(false); setRescheduleAppointment(null); }}
        onOk={handleReschedule}
        confirmLoading={rescheduleAppointmentMutation.isPending}
        okText={t('scheduling.reschedule')}
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: !rescheduleSlot }}
        width={560}
      >
        {rescheduleAppointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Current appointment info */}
            <div style={{
              background: 'var(--gray-50)', borderRadius: 12, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                <strong>{t('scheduling.patient')}:</strong>{' '}
                {rescheduleAppointment.patient
                  ? `${rescheduleAppointment.patient.lastName} ${rescheduleAppointment.patient.firstName}`
                  : ''}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                <strong>{t('scheduling.doctor')}:</strong>{' '}
                {rescheduleAppointment.doctor
                  ? `${rescheduleAppointment.doctor.lastName} ${rescheduleAppointment.doctor.firstName}`
                  : ''}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                <strong>{t('scheduling.currentDateTime')}:</strong>{' '}
                {rescheduleAppointment.date ? new Date(rescheduleAppointment.date).toLocaleDateString('ru-RU') : ''}{' '}
                {rescheduleAppointment.startTime?.slice(0, 5)} — {rescheduleAppointment.endTime?.slice(0, 5)}
              </div>
            </div>

            {/* New date picker */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{t('scheduling.newDate')}</div>
              <DatePicker
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  if (!current) return false;
                  const tomorrow = dayjs().add(1, 'day').startOf('day');
                  const maxDate = dayjs().add(14, 'day').endOf('day');
                  return current.isBefore(tomorrow) || current.isAfter(maxDate);
                }}
                onChange={(d) => {
                  setRescheduleDate(d ? d.format('YYYY-MM-DD') : '');
                  setRescheduleSlot(null);
                }}
              />
            </div>

            {/* Available slots */}
            {rescheduleDate && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                  {t('scheduling.availableSlots')}
                </div>
                {rescheduleSlots && (rescheduleSlots as any[]).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(rescheduleSlots as any[])
                      .filter((s: any) => s.available)
                      .map((s: any) => (
                        <Button
                          key={s.startTime}
                          type={
                            rescheduleSlot?.startTime === s.startTime.slice(0, 5) ? 'primary' : 'default'
                          }
                          size="small"
                          style={{ borderRadius: 8 }}
                          onClick={() =>
                            setRescheduleSlot({
                              startTime: s.startTime.slice(0, 5),
                              endTime: s.endTime.slice(0, 5),
                            })
                          }
                        >
                          {s.startTime.slice(0, 5)}
                        </Button>
                      ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                    {t('public.noSlotsAvailable')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SchedulingPage;

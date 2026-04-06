import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Steps,
  Select,
  Button,
  Form,
  Input,
  Spin,
  Empty,
  message,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import {
  usePublicDoctors,
  usePublicSpecialties,
  usePublicSlots,
  usePublicDoctorProfile,
  usePublicBookAppointment,
} from '../../hooks/usePublic';
import { publicService } from '../../api/services/public.service';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const BookingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [specialty, setSpecialty] = useState('');
  const [stepsDirection, setStepsDirection] = useState<
    'horizontal' | 'vertical'
  >(window.innerWidth < 768 ? 'vertical' : 'horizontal');

  // Responsive steps direction
  useEffect(() => {
    const handleResize = () => {
      setStepsDirection(
        window.innerWidth < 768 ? 'vertical' : 'horizontal',
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data hooks
  const { data: specialties } = usePublicSpecialties();
  const { data: doctors, isLoading: loadingDoctors } =
    usePublicDoctors(specialty || undefined);
  const { data: doctorProfile } = usePublicDoctorProfile(doctorId || '');
  const { data: slots, isLoading: loadingSlots } = usePublicSlots(
    selectedDoctor?.id,
    selectedDate,
  );
  const bookMutation = usePublicBookAppointment();

  // If doctorId from URL, pre-select and skip to step 2
  useEffect(() => {
    if (doctorId && doctorProfile && !selectedDoctor) {
      setSelectedDoctor(doctorProfile);
      setCurrentStep(1);
    }
  }, [doctorId, doctorProfile, selectedDoctor]);

  // Generate next 14 days
  const dateOptions = useMemo(() => {
    const days: { date: string; label: string; dayOfWeek: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = dayjs().add(i, 'day');
      days.push({
        date: d.format('YYYY-MM-DD'),
        label: d.format('D MMM'),
        dayOfWeek: d.format('dd').toUpperCase(),
      });
    }
    return days;
  }, []);

  const resetAll = () => {
    setCurrentStep(0);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime(null);
    setSpecialty('');
    form.resetFields();
  };

  const goBack = () => {
    if (currentStep === 1 && doctorId) {
      // If came via URL, go back to home instead of step 0
      navigate('/');
      return;
    }
    setCurrentStep((s) => s - 1);
  };

  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setSelectedTime(null);
    setCurrentStep(1);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setCurrentStep(2);
  };

  const handleTimeSelect = (slot: any) => {
    setSelectedTime({ startTime: slot.startTime, endTime: slot.endTime });
    setCurrentStep(3);
  };

  const handleSubmit = async (values: any) => {
    if (!selectedDoctor || !selectedTime) return;
    if (selectedTime.endTime <= selectedTime.startTime) {
      message.error(t('public.invalidTimeRange'));
      return;
    }
    try {
      // Re-check slot availability before booking
      const freshSlots = await publicService.getSlots(selectedDoctor.id, selectedDate);
      const stillAvailable = (freshSlots || []).some(
        (slot: any) => slot.startTime === selectedTime.startTime && slot.available !== false,
      );
      if (!stillAvailable) {
        message.warning(t('public.slotAlreadyTaken'));
        setCurrentStep(2);
        return;
      }
      await bookMutation.mutateAsync({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        startTime: selectedTime.startTime,
        endTime: selectedTime.endTime,
        patientFirstName: values.firstName,
        patientLastName: values.lastName,
        patientPhone: values.phone,
        patientEmail: values.email,
        notes: values.notes,
        type: 'primary',
      });
      setCurrentStep(4);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Error';
      message.error(msg);
    }
  };

  // Steps config
  const stepsItems = [
    { title: t('public.selectDoctor'), icon: <UserOutlined /> },
    { title: t('public.selectDate'), icon: <CalendarOutlined /> },
    { title: t('public.selectTime'), icon: <ClockCircleOutlined /> },
    { title: t('public.patientInfo'), icon: <SolutionOutlined /> },
    { title: t('public.confirmation'), icon: <CheckCircleOutlined /> },
  ];

  // Doctor mini summary (for steps 2-4)
  const DoctorSummary = () =>
    selectedDoctor ? (
      <div style={styles.summaryCard}>
        <Avatar
          size={48}
          icon={<UserOutlined />}
          src={selectedDoctor.photoUrl}
          style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)' }}
        />
        <div>
          <div style={styles.summaryName}>
            {selectedDoctor.firstName} {selectedDoctor.lastName}
          </div>
          <div style={styles.summarySpecialty}>
            {selectedDoctor.specialty || selectedDoctor.specialization}
          </div>
        </div>
      </div>
    ) : null;

  // Booking summary (for step 4)
  const BookingSummary = () => (
    <div style={styles.bookingSummary}>
      <DoctorSummary />
      {selectedDate && (
        <div style={styles.summaryRow}>
          <CalendarOutlined style={{ color: 'var(--primary-500)' }} />
          <span>{dayjs(selectedDate).format('D MMMM YYYY, dddd')}</span>
        </div>
      )}
      {selectedTime && (
        <div style={styles.summaryRow}>
          <ClockCircleOutlined style={{ color: 'var(--primary-500)' }} />
          <span>
            {selectedTime.startTime} — {selectedTime.endTime}
          </span>
        </div>
      )}
    </div>
  );

  // STEP 1: Select Doctor
  const renderStep1 = () => (
    <div className="animate-fade-in-up">
      <div style={styles.filterRow}>
        <Select
          placeholder={t('public.filterBySpecialty')}
          allowClear
          style={{ minWidth: 240 }}
          value={specialty || undefined}
          onChange={(val) => setSpecialty(val || '')}
          size="large"
        >
          {(specialties || []).map((s: any) => (
            <Select.Option key={s.id || s} value={s.name || s}>
              {s.name || s}
            </Select.Option>
          ))}
        </Select>
      </div>
      {loadingDoctors ? (
        <div style={styles.center}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: 'var(--gray-500)' }}>
            {t('public.loadingDoctors')}
          </div>
        </div>
      ) : !doctors?.length ? (
        <Empty description={t('public.noDoctorsFound')} />
      ) : (
        <div style={styles.doctorGrid}>
          {(doctors || []).map((doc: any) => (
            <div
              key={doc.id}
              style={styles.doctorMiniCard}
              className="doctor-mini-card"
              onClick={() => handleDoctorSelect(doc)}
            >
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={doc.photoUrl}
                style={{
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-500)',
                }}
              />
              <div style={styles.miniCardName}>
                {doc.firstName} {doc.lastName}
              </div>
              <div style={styles.miniCardSpecialty}>
                {doc.specialty || doc.specialization}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // STEP 2: Select Date
  const renderStep2 = () => (
    <div className="animate-fade-in-up">
      <DoctorSummary />
      <h3 style={styles.stepSubtitle}>{t('public.next14days')}</h3>
      <div style={styles.dateGrid}>
        {dateOptions.map((d, idx) => {
          const isToday = idx === 0;
          const isTomorrow = idx === 1;
          return (
            <div
              key={d.date}
              className="date-card"
              style={{
                ...styles.dateCard,
                ...(selectedDate === d.date ? styles.dateCardActive : {}),
              }}
              onClick={() => handleDateSelect(d.date)}
            >
              <div style={styles.dateDayOfWeek}>{d.dayOfWeek}</div>
              <div style={styles.dateLabel}>{d.label}</div>
              {isToday && (
                <div style={styles.dateBadge}>{t('public.today')}</div>
              )}
              {isTomorrow && (
                <div style={styles.dateBadge}>{t('public.tomorrow')}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // STEP 3: Select Time
  const renderStep3 = () => (
    <div className="animate-fade-in-up">
      <div style={styles.bookingSummary}>
        <DoctorSummary />
        <div style={styles.summaryRow}>
          <CalendarOutlined style={{ color: 'var(--primary-500)' }} />
          <span>{dayjs(selectedDate).format('D MMMM YYYY, dddd')}</span>
        </div>
      </div>
      {loadingSlots ? (
        <div style={styles.center}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: 'var(--gray-500)' }}>
            {t('public.loadingSlots')}
          </div>
        </div>
      ) : !slots?.length ? (
        <Empty
          description={t('public.noSlotsAvailable')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div style={styles.slotsGrid}>
          {(slots || []).map((slot: any, idx: number) => {
            const isAvailable = slot.available !== false;
            const isSelected =
              selectedTime?.startTime === slot.startTime &&
              selectedTime?.endTime === slot.endTime;
            return (
              <button
                key={idx}
                disabled={!isAvailable}
                onClick={() => isAvailable && handleTimeSelect(slot)}
                className="slot-button"
                style={{
                  ...styles.slotBtn,
                  ...(isAvailable ? styles.slotAvailable : styles.slotBooked),
                  ...(isSelected ? styles.slotSelected : {}),
                }}
              >
                {slot.startTime}–{slot.endTime}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // STEP 4: Patient Info
  const renderStep4 = () => (
    <div className="animate-fade-in-up">
      <h3 style={styles.stepSubtitle}>
        {selectedTime
          ? `${dayjs(selectedDate).format('D MMMM')} — ${selectedTime.startTime} – ${selectedTime.endTime}`
          : ''}
      </h3>
      <BookingSummary />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 24 }}
        size="large"
      >
        <div className="booking-form-row" style={styles.formRow}>
          <Form.Item
            name="firstName"
            label={t('public.firstName')}
            rules={[{ required: true, message: `${t('public.firstName')} *` }]}
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label={t('public.lastName')}
            rules={[{ required: true, message: `${t('public.lastName')} *` }]}
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
        </div>
        <Form.Item
          name="phone"
          label={t('public.phone')}
          rules={[{ required: true, message: `${t('public.phone')} *` }]}
        >
          <Input placeholder={t('public.phonePlaceholder')} />
        </Form.Item>
        <Form.Item name="email" label={t('public.email')}>
          <Input type="email" />
        </Form.Item>
        <Form.Item name="notes" label={t('public.notes')}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={bookMutation.isPending}
            block
            size="large"
            icon={<MedicineBoxOutlined />}
            style={styles.submitBtn}
          >
            {t('public.submitBooking')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  // STEP 5: Confirmation
  const renderStep5 = () => (
    <div className="animate-fade-in-up" style={styles.confirmationWrap}>
      <div style={styles.successCircle}>
        <CheckCircleOutlined style={styles.successIcon} />
      </div>
      <h2 style={styles.confirmTitle}>
        {t('public.appointmentCreatedMessage')}
      </h2>
      <p style={styles.confirmSubtitle}>
        {t('public.waitingReceptionConfirmation')}
      </p>
      <div className="booking-confirm-summary" style={styles.confirmSummary}>
        <div style={styles.confirmRow}>
          <span style={styles.confirmLabel}>{t('public.doctor')}:</span>
          <span>
            {selectedDoctor?.firstName} {selectedDoctor?.lastName}
          </span>
        </div>
        <div style={styles.confirmRow}>
          <span style={styles.confirmLabel}>{t('public.date')}:</span>
          <span>{dayjs(selectedDate).format('D MMMM YYYY, dddd')}</span>
        </div>
        <div style={styles.confirmRow}>
          <span style={styles.confirmLabel}>{t('public.time')}:</span>
          <span>
            {selectedTime?.startTime} — {selectedTime?.endTime}
          </span>
        </div>
      </div>
      <div className="booking-confirm-buttons" style={styles.confirmButtons}>
        <Button size="large" onClick={() => navigate('/')}>
          {t('public.goHome')}
        </Button>
        <Button type="primary" size="large" onClick={resetAll}>
          {t('public.bookAgain')}
        </Button>
      </div>
    </div>
  );

  const stepRenderers = [
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
  ];

  return (
    <div className="public-section" style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 className="public-section-title" style={{ textAlign: 'center' }}>
        {t('public.bookingTitle')}
      </h1>
      <Steps
        current={currentStep}
        direction={stepsDirection}
        items={stepsItems}
        style={{ marginBottom: 40 }}
        size="small"
      />
      <div className="booking-step-content" style={styles.stepContent}>
        {currentStep > 0 && currentStep < 4 && (
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
            style={styles.backBtn}
          >
            {t('public.back')}
          </Button>
        )}
        {stepRenderers[currentStep]()}
      </div>

      <style>{`
        .doctor-mini-card {
          cursor: pointer;
          transition: transform 200ms, box-shadow 200ms;
        }
        .doctor-mini-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .date-card {
          cursor: pointer;
          transition: transform 150ms, box-shadow 150ms, border-color 150ms;
        }
        .date-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-300) !important;
        }
        .slot-button {
          cursor: pointer;
          transition: all 150ms;
          font-family: inherit;
        }
        .slot-button:not(:disabled):hover {
          transform: scale(1.05);
          box-shadow: var(--shadow-colored-blue);
        }
        .slot-button:disabled {
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .booking-form-row {
            flex-direction: column !important;
          }
        }
        @media (max-width: 576px) {
          .booking-step-content {
            padding: 16px !important;
          }
          .booking-confirm-buttons {
            flex-direction: column !important;
          }
          .booking-confirm-buttons .ant-btn {
            width: 100%;
          }
          .booking-confirm-summary {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  stepContent: {
    background: 'white',
    borderRadius: 'var(--radius-xl)',
    padding: 32,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--gray-100)',
    position: 'relative',
  },
  backBtn: {
    marginBottom: 16,
    color: 'var(--gray-500)',
    fontWeight: 500,
  },
  filterRow: {
    marginBottom: 24,
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  center: {
    textAlign: 'center' as const,
    padding: 48,
  },
  doctorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 16,
  },
  doctorMiniCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-100)',
    background: 'white',
    textAlign: 'center' as const,
  },
  miniCardName: {
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--gray-800)',
    lineHeight: 1.3,
  },
  miniCardSpecialty: {
    fontSize: 12,
    color: 'var(--gray-500)',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--primary-50)',
    marginBottom: 20,
  },
  summaryName: {
    fontWeight: 600,
    fontSize: 15,
    color: 'var(--gray-800)',
  },
  summarySpecialty: {
    fontSize: 13,
    color: 'var(--gray-500)',
  },
  stepSubtitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--gray-700)',
    marginBottom: 16,
  },
  dateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: 10,
  },
  dateCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    padding: '14px 8px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--gray-200)',
    background: 'white',
    textAlign: 'center' as const,
  },
  dateCardActive: {
    borderColor: 'var(--primary-500)',
    background: 'var(--primary-50)',
  },
  dateDayOfWeek: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--gray-400)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--gray-800)',
  },
  dateBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--primary-600)',
    background: 'var(--primary-100)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
  },
  bookingSummary: {
    marginBottom: 20,
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    fontSize: 14,
    color: 'var(--gray-700)',
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 10,
    marginTop: 16,
  },
  slotBtn: {
    padding: '12px 8px',
    borderRadius: 'var(--radius-md)',
    fontSize: 15,
    fontWeight: 600,
    border: '2px solid',
    background: 'white',
    outline: 'none',
  },
  slotAvailable: {
    borderColor: 'var(--primary-300)',
    color: 'var(--primary-700)',
  },
  slotBooked: {
    borderColor: 'var(--gray-200)',
    color: 'var(--gray-400)',
    background: 'var(--gray-50)',
  },
  slotSelected: {
    borderColor: 'var(--primary-500)',
    background: 'var(--primary-50)',
    boxShadow: 'var(--shadow-colored-blue)',
  },
  formRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  submitBtn: {
    height: 48,
    fontWeight: 600,
    fontSize: 16,
  },
  confirmationWrap: {
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'var(--accent-50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successIcon: {
    fontSize: 40,
    color: 'var(--accent-500)',
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--gray-800)',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 15,
    color: 'var(--gray-500)',
    marginBottom: 28,
  },
  confirmSummary: {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    gap: 8,
    textAlign: 'left' as const,
    background: 'var(--gray-50)',
    padding: '20px 28px',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 28,
  },
  confirmRow: {
    display: 'flex',
    gap: 10,
    fontSize: 14,
    color: 'var(--gray-700)',
  },
  confirmLabel: {
    fontWeight: 600,
    color: 'var(--gray-500)',
    minWidth: 60,
  },
  confirmButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
};

export default BookingPage;

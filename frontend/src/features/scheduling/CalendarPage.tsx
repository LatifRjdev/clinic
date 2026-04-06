import React, { useState, useMemo } from 'react';
import {
  Calendar, Badge, Select, Spin, Tooltip, Drawer, Tag, Button, Space, Segmented, message,
} from 'antd';
import {
  LeftOutlined, RightOutlined, CalendarOutlined,
  CheckOutlined, CheckCircleOutlined, CloseOutlined,
  FileTextOutlined, UserSwitchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');
import {
  useAppointments, useDoctors, useChangeAppointmentStatus,
} from '../../hooks/useAppointments';
import type { Appointment } from '../../types';

// ── static color maps (outside component) ──
const statusBadgeColors: Record<string, string> = {
  scheduled: 'processing',
  waiting_confirmation: 'warning',
  confirmed: 'cyan',
  in_progress: 'blue',
  completed: 'success',
  cancelled: 'default',
  no_show: 'error',
};

const statusDotColors: Record<string, string> = {
  scheduled: '#1677ff',
  waiting_confirmation: '#faad14',
  confirmed: '#13c2c2',
  in_progress: '#2f54eb',
  completed: '#52c41a',
  cancelled: '#d9d9d9',
  no_show: '#ff4d4f',
};

type CalendarView = 'month' | 'week';

const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [detailDate, setDetailDate] = useState<Dayjs | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  const dateFrom = currentDate.startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
  const dateTo = currentDate.endOf('month').add(7, 'day').format('YYYY-MM-DD');

  const { data: appointmentsData, isLoading } = useAppointments({
    dateFrom,
    dateTo,
    doctorId: selectedDoctor || undefined,
    limit: 500,
  });
  const { data: doctors } = useDoctors();
  const changeStatus = useChangeAppointmentStatus();

  const appointments: Appointment[] = useMemo(() => {
    if (!appointmentsData) return [];
    return Array.isArray(appointmentsData) ? appointmentsData : appointmentsData.data || [];
  }, [appointmentsData]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      const dateKey = apt.date?.slice(0, 10);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(apt);
    });
    return map;
  }, [appointments]);

  const statusLabels: Record<string, string> = {
    scheduled: t('scheduling.scheduled'),
    waiting_confirmation: t('scheduling.waitingConfirmation'),
    confirmed: t('scheduling.confirmed'),
    in_progress: t('scheduling.inProgress'),
    completed: t('scheduling.completed'),
    cancelled: t('scheduling.cancelled'),
    no_show: t('scheduling.noShow'),
  };

  // ── stats for the current month ──
  const monthStats = useMemo(() => {
    const stats = { total: 0, confirmed: 0, completed: 0, cancelled: 0 };
    appointments.forEach((a) => {
      stats.total++;
      if (a.status === 'confirmed' || a.status === 'in_progress') stats.confirmed++;
      if (a.status === 'completed') stats.completed++;
      if (a.status === 'cancelled' || a.status === 'no_show') stats.cancelled++;
    });
    return stats;
  }, [appointments]);

  // ── quick status change from drawer ──
  const handleQuickStatus = async (id: string, status: string) => {
    try {
      await changeStatus.mutateAsync({ id, status });
      message.success(statusLabels[status]);
    } catch {
      message.error(t('common.error'));
    }
  };

  // ── cell render for month view ──
  const dateCellRender = (value: Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const dayAppointments = appointmentsByDate[dateKey] || [];
    if (dayAppointments.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
        {/* badge count */}
        <div style={{
          position: 'absolute', top: -22, right: 0,
          background: 'var(--primary-500)', color: '#fff',
          fontSize: 10, fontWeight: 700, borderRadius: 10,
          minWidth: 18, height: 18, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 5px',
        }}>
          {dayAppointments.length}
        </div>
        {dayAppointments.slice(0, 3).map((apt) => {
          const patientName = apt.patient
            ? `${apt.patient.lastName} ${apt.patient.firstName?.charAt(0)}.`
            : '';
          const doctorName = apt.doctor
            ? `${apt.doctor.lastName} ${apt.doctor.firstName?.charAt(0)}.`
            : '';
          return (
            <Tooltip
              key={apt.id}
              title={`${apt.startTime?.slice(0, 5)} ${patientName} → ${doctorName}`}
            >
              <Badge
                status={statusBadgeColors[apt.status] as any}
                text={
                  <span style={{ fontSize: 11, lineHeight: 1.2 }}>
                    {apt.startTime?.slice(0, 5)} {patientName}
                  </span>
                }
                style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
            </Tooltip>
          );
        })}
        {dayAppointments.length > 3 && (
          <span style={{ fontSize: 11, color: 'var(--primary-500)', fontWeight: 600, cursor: 'pointer' }}>
            +{dayAppointments.length - 3} {t('common.more') || '...'}
          </span>
        )}
      </div>
    );
  };

  // ── detail appointments for drawer ──
  const detailAppointments = detailDate
    ? (appointmentsByDate[detailDate.format('YYYY-MM-DD')] || [])
        .slice()
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    : [];

  // ── week view data ──
  const weekStart = currentDate.startOf('week');
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  const hours = Array.from({ length: 21 }, (_, i) => `${String(Math.floor(i / 2) + 8).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`);

  // ── header render ──
  const headerRender = ({ value, onChange }: { value: Dayjs; onChange: (v: Dayjs) => void }) => {
    const isWeek = calendarView === 'week';
    const label = isWeek
      ? `${weekStart.format('D MMM')} — ${weekStart.add(6, 'day').format('D MMM YYYY')}`
      : value.format('MMMM YYYY');
    const unit = isWeek ? 'week' : 'month';

    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 0', marginBottom: 8, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const v = value.subtract(1, unit as any);
              onChange(v);
              setCurrentDate(v);
            }}
            style={{
              border: '1px solid var(--gray-200)', borderRadius: 8, background: '#fff',
              padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <LeftOutlined style={{ fontSize: 12 }} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-800)', textTransform: 'capitalize' }}>
            {label}
          </span>
          <button
            onClick={() => {
              const v = value.add(1, unit as any);
              onChange(v);
              setCurrentDate(v);
            }}
            style={{
              border: '1px solid var(--gray-200)', borderRadius: 8, background: '#fff',
              padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <RightOutlined style={{ fontSize: 12 }} />
          </button>
          <button
            onClick={() => { onChange(dayjs()); setCurrentDate(dayjs()); }}
            style={{
              border: '1px solid var(--gray-200)', borderRadius: 8, background: '#fff',
              padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--primary-600)',
            }}
          >
            {t('scheduling.today')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Segmented
            value={calendarView}
            onChange={(v) => setCalendarView(v as CalendarView)}
            options={[
              { value: 'month', label: t('scheduling.month') },
              { value: 'week', label: t('scheduling.week') },
            ]}
            size="small"
          />
          <Select
            value={selectedDoctor}
            onChange={setSelectedDoctor}
            style={{ minWidth: 160, maxWidth: 220 }}
            allowClear
            placeholder={t('scheduling.allDoctors')}
            options={[
              { value: '', label: t('scheduling.allDoctors') },
              ...(doctors || []).map((d) => ({
                value: d.id,
                label: `${d.lastName} ${d.firstName}`,
              })),
            ]}
          />
        </div>
      </div>
    );
  };

  // ── week view component ──
  const WeekView = () => {
    const isToday = (d: Dayjs) => d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    const isSunday = (d: Dayjs) => d.day() === 0;

    return (
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, minmax(80px, 1fr))', borderBottom: '1px solid var(--gray-200)', minWidth: 620 }}>
          <div />
          {weekDays.map((d) => (
            <div
              key={d.format('YYYY-MM-DD')}
              style={{
                textAlign: 'center', padding: '10px 4px', fontWeight: 600, fontSize: 13,
                color: isToday(d) ? 'var(--primary-600)' : isSunday(d) ? 'var(--gray-300)' : 'var(--gray-600)',
                background: isToday(d) ? 'var(--primary-50)' : isSunday(d) ? '#fafafa' : undefined,
                borderBottom: isToday(d) ? '2px solid var(--primary-500)' : undefined,
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase' }}>{d.format('dd')}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{d.format('D')}</div>
              {(appointmentsByDate[d.format('YYYY-MM-DD')] || []).length > 0 && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--primary-500)',
                  marginTop: 2,
                }}>
                  {(appointmentsByDate[d.format('YYYY-MM-DD')] || []).length} {t('scheduling.all').toLowerCase()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* time grid */}
        <div style={{ position: 'relative' }}>
          {hours.map((time) => (
            <div
              key={time}
              style={{
                display: 'grid', gridTemplateColumns: '56px repeat(7, minmax(80px, 1fr))',
                minHeight: 32, borderBottom: '1px solid var(--gray-50)', minWidth: 620,
              }}
            >
              <div style={{
                fontSize: 10, color: 'var(--gray-400)', textAlign: 'right',
                paddingRight: 8, paddingTop: 2, fontWeight: 500,
              }}>
                {time}
              </div>
              {weekDays.map((d) => {
                const dateKey = d.format('YYYY-MM-DD');
                const slotAppts = (appointmentsByDate[dateKey] || []).filter(
                  (a) => a.startTime?.slice(0, 5) === time
                );
                return (
                  <div
                    key={dateKey}
                    style={{
                      borderLeft: '1px solid var(--gray-50)',
                      padding: '1px 2px',
                      background: isSunday(d) ? '#fafafa' : undefined,
                      cursor: slotAppts.length ? 'pointer' : undefined,
                    }}
                    onClick={() => {
                      if (slotAppts.length) {
                        setDetailDate(d);
                      }
                    }}
                  >
                    {slotAppts.map((apt) => {
                      const patientName = apt.patient
                        ? `${apt.patient.lastName} ${apt.patient.firstName?.charAt(0)}.`
                        : '';
                      return (
                        <Tooltip key={apt.id} title={`${patientName} ${apt.startTime?.slice(0, 5)}–${apt.endTime?.slice(0, 5)}`}>
                          <div style={{
                            fontSize: 10, lineHeight: 1.3, padding: '2px 4px', borderRadius: 4,
                            marginBottom: 1, cursor: 'pointer', fontWeight: 500,
                            background: statusDotColors[apt.status] + '18',
                            borderLeft: `3px solid ${statusDotColors[apt.status]}`,
                            color: 'var(--gray-700)', overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {patientName}
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2>
          <CalendarOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
          {t('nav.calendar')}
        </h2>
      </div>

      {/* ── 1. stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { label: t('scheduling.all'), value: monthStats.total, color: '#3b82f6', bg: '#eff6ff' },
          { label: t('scheduling.confirmed'), value: monthStats.confirmed, color: '#0ea5e9', bg: '#f0f9ff' },
          { label: t('scheduling.completed'), value: monthStats.completed, color: '#10b981', bg: '#ecfdf5' },
          { label: t('scheduling.cancelled'), value: monthStats.cancelled, color: '#ef4444', bg: '#fef2f2' },
        ].map((s) => (
          <div key={s.label} className="modern-card" style={{ margin: 0 }}>
            <div className="modern-card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: s.color,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-500)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. status legend ── */}
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16,
        padding: '10px 16px', background: 'var(--gray-50)', borderRadius: 10,
      }}>
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-600)' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusDotColors[key],
            }} />
            {label}
          </div>
        ))}
      </div>

      {/* ── calendar / week view ── */}
      <div className="modern-card">
        <div className="modern-card-body" style={{ padding: '0 16px 16px' }}>
          {calendarView === 'month' ? (
            <Calendar
              cellRender={(current, info) => {
                if (info.type === 'date') return dateCellRender(current);
                return null;
              }}
              headerRender={headerRender}
              onSelect={(date) => {
                const dateKey = date.format('YYYY-MM-DD');
                if (appointmentsByDate[dateKey]?.length) {
                  setDetailDate(date);
                }
              }}
              fullCellRender={undefined}
            />
          ) : (
            <>
              {headerRender({ value: currentDate, onChange: setCurrentDate })}
              <WeekView />
            </>
          )}
        </div>
      </div>

      {/* ── 3. day detail drawer (replaces modal) ── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarOutlined style={{ color: 'var(--primary-500)' }} />
            <span>{detailDate?.format('dddd, D MMMM YYYY')}</span>
            <Tag color="blue" style={{ marginLeft: 'auto', borderRadius: 20 }}>
              {detailAppointments.length} {t('scheduling.all').toLowerCase()}
            </Tag>
          </div>
        }
        open={!!detailDate}
        onClose={() => setDetailDate(null)}
        width={520}
        styles={{ body: { padding: '12px 16px' } }}
      >
        {detailAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>
            {t('common.noData')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {detailAppointments.map((apt) => {
              const doctorName = apt.doctor
                ? `${apt.doctor.lastName} ${apt.doctor.firstName}`
                : '';
              const patientName = apt.patient
                ? `${apt.patient.lastName} ${apt.patient.firstName}`
                : '';
              return (
                <div
                  key={apt.id}
                  style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: '#fff', border: '1px solid var(--gray-100)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 16, color: 'var(--primary-600)',
                      minWidth: 56,
                    }}>
                      {apt.startTime?.slice(0, 5)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>
                        {patientName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                        {doctorName} &middot; {apt.startTime?.slice(0, 5)}–{apt.endTime?.slice(0, 5)}
                      </div>
                    </div>
                    <Tag
                      color={statusBadgeColors[apt.status]}
                      style={{ borderRadius: 20, margin: 0, fontSize: 11 }}
                    >
                      {statusLabels[apt.status] || apt.status}
                    </Tag>
                  </div>

                  {/* action buttons */}
                  <div style={{
                    display: 'flex', gap: 6, paddingTop: 8, flexWrap: 'wrap',
                    borderTop: '1px solid var(--gray-50)',
                  }}>
                    {/* confirm */}
                    {apt.status === 'waiting_confirmation' && (
                      <Button
                        size="small" type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleQuickStatus(apt.id, 'confirmed')}
                        loading={changeStatus.isPending}
                      >
                        {t('scheduling.confirm')}
                      </Button>
                    )}
                    {/* arrived */}
                    {apt.status === 'confirmed' && (
                      <Button
                        size="small"
                        icon={<UserSwitchOutlined />}
                        style={{ background: '#10b981', color: '#fff', border: 'none' }}
                        onClick={() => handleQuickStatus(apt.id, 'in_progress')}
                        loading={changeStatus.isPending}
                      >
                        {t('scheduling.arrived')}
                      </Button>
                    )}
                    {/* complete */}
                    {apt.status === 'in_progress' && (
                      <Button
                        size="small"
                        icon={<CheckCircleOutlined />}
                        style={{ background: '#059669', color: '#fff', border: 'none' }}
                        onClick={() => handleQuickStatus(apt.id, 'completed')}
                        loading={changeStatus.isPending}
                      >
                        {t('scheduling.complete')}
                      </Button>
                    )}
                    {/* EMR */}
                    {['confirmed', 'in_progress'].includes(apt.status) && (
                      <Button
                        size="small"
                        icon={<FileTextOutlined />}
                        style={{ background: '#8b5cf6', color: '#fff', border: 'none' }}
                        onClick={() => navigate(`/emr?appointmentId=${apt.id}&patientId=${apt.patientId}`)}
                      >
                        {t('nav.emr')}
                      </Button>
                    )}
                    {/* cancel */}
                    {['scheduled', 'waiting_confirmation', 'confirmed'].includes(apt.status) && (
                      <Button
                        size="small" danger
                        icon={<CloseOutlined />}
                        onClick={() => handleQuickStatus(apt.id, 'cancelled')}
                        loading={changeStatus.isPending}
                      >
                        {t('scheduling.cancel')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CalendarPage;

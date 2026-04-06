import React, { useState, useMemo } from 'react';
import { Table, Row, Col, Avatar, DatePicker, Space, Spin, Progress } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDashboard, useDoctorLoad } from '../../hooks/useAnalytics';
import { formatCurrency, getCurrencySymbol } from '../../utils/format';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const PIE_KEYS = [
  { key: 'analytics.sourceReception', percent: 45, color: 'var(--primary-500)' },
  { key: 'analytics.sourceOnline', percent: 30, color: 'var(--accent-500)' },
  { key: 'analytics.sourceReferral', percent: 15, color: 'var(--warm-500)' },
  { key: 'analytics.sourceOther', percent: 10, color: 'var(--gray-400)' },
];

const SERVICE_KEYS = [
  { key: 'analytics.serviceConsultations', count: 342 },
  { key: 'analytics.serviceDiagnostics', count: 256 },
  { key: 'analytics.serviceLaboratory', count: 198 },
  { key: 'analytics.serviceProcedures', count: 145 },
  { key: 'analytics.serviceOther', count: 87 },
];

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const today = dayjs();
  const monthStart = today.startOf('month').format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState<[string, string]>([monthStart, today.format('YYYY-MM-DD')]);

  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: doctorLoadData, isLoading: docLoading } = useDoctorLoad({
    dateFrom: dateRange[0],
    dateTo: dateRange[1],
  });

  const doctorStats = (doctorLoadData || []) as Array<{
    doctorId: string;
    doctorName: string;
    specialty: string;
    appointments: number;
    revenue: number;
    avgCheck: number;
    load: number;
  }>;

  const formatMoney = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  const formatPrice = (p: number) => `${(p / 1000000).toFixed(1)}M ${getCurrencySymbol()}`;

  // Generate mock monthly revenue data (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const data: { month: string; value: number }[] = [];
    const monthKeys = [
      t('common.monthJanShort'), t('common.monthFebShort'), t('common.monthMarShort'),
      t('common.monthAprShort'), t('common.monthMayShort'), t('common.monthJunShort'),
      t('common.monthJulShort'), t('common.monthAugShort'), t('common.monthSepShort'),
      t('common.monthOctShort'), t('common.monthNovShort'), t('common.monthDecShort'),
    ];
    for (let i = 5; i >= 0; i--) {
      const d = dayjs().subtract(i, 'month');
      const monthIdx = d.month();
      const value = Math.floor(50000 + Math.random() * 150000);
      data.push({ month: monthKeys[monthIdx], value });
    }
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const maxRevenue = Math.max(...monthlyRevenue.map((d) => d.value));

  // Build conic-gradient for pie chart
  const pieGradient = useMemo(() => {
    let cumulative = 0;
    const stops: string[] = [];
    PIE_KEYS.forEach((seg) => {
      stops.push(`${seg.color} ${cumulative}%`);
      cumulative += seg.percent;
      stops.push(`${seg.color} ${cumulative}%`);
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, []);

  const serviceMax = Math.max(...SERVICE_KEYS.map((s) => s.count));

  const statCards = [
    {
      icon: <DollarOutlined />,
      iconColor: 'green',
      value: dashboard?.monthRevenue ? formatMoney(dashboard.monthRevenue) : '—',
      label: t('analytics.monthRevenue'),
      suffix: getCurrencySymbol(),
    },
    {
      icon: <TeamOutlined />,
      iconColor: 'blue',
      value: String(dashboard?.totalPatients ?? '—'),
      label: t('analytics.totalPatients'),
    },
    {
      icon: <CalendarOutlined />,
      iconColor: 'amber',
      value: String(dashboard?.todayAppointments ?? '—'),
      label: t('analytics.appointmentsToday'),
    },
    {
      icon: <PercentageOutlined />,
      iconColor: 'green',
      value: String(dashboard?.totalDoctors ?? '—'),
      label: t('analytics.doctorsInSystem'),
    },
  ];

  const columns = [
    {
      title: t('scheduling.doctor'),
      key: 'doctor',
      render: (_: unknown, record: (typeof doctorStats)[0]) => (
        <Space>
          <Avatar size={32} style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', fontSize: 13 }}>
            {(record.doctorName || '?').charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: 14 }}>{record.doctorName}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{record.specialty}</div>
          </div>
        </Space>
      ),
    },
    {
      title: t('analytics.appointmentsCount'),
      dataIndex: 'appointments',
      key: 'appointments',
      width: 100,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span>,
      sorter: (a: (typeof doctorStats)[0], b: (typeof doctorStats)[0]) => a.appointments - b.appointments,
    },
    {
      title: t('analytics.revenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      width: 140,
      render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--accent-600)' }}>{formatPrice(v)}</span>,
      sorter: (a: (typeof doctorStats)[0], b: (typeof doctorStats)[0]) => a.revenue - b.revenue,
    },
    {
      title: t('analytics.avgCheck'),
      dataIndex: 'avgCheck',
      key: 'avgCheck',
      width: 160,
      render: (v: number) => (
        <span style={{ color: 'var(--gray-600)' }}>{v ? formatCurrency(v) : '—'}</span>
      ),
    },
    {
      title: t('analytics.load'),
      dataIndex: 'load',
      key: 'load',
      width: 120,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--gray-100)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${v || 0}%`,
                height: '100%',
                borderRadius: 99,
                background: v > 80 ? 'var(--accent-500)' : v > 60 ? 'var(--primary-500)' : 'var(--warm-500)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', minWidth: 32 }}>{v || 0}%</span>
        </div>
      ),
    },
  ];

  if (dashLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2>{t('nav.analytics')}</h2>
        <Space>
          <RangePicker
            style={{ borderRadius: 'var(--radius-md)' }}
            defaultValue={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              }
            }}
          />
        </Space>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }} className="stagger-children">
        {statCards.map((card, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <div className="stat-card">
              <div className={`stat-card-icon ${card.iconColor}`}>
                {card.icon}
              </div>
              <div className="stat-card-value">
                {card.value}
                {card.suffix && (
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>
                    {card.suffix}
                  </span>
                )}
              </div>
              <div className="stat-card-label">{card.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Chart 1: Monthly Revenue Bar Chart */}
        <Col xs={24} md={8}>
          <div className="modern-card" style={{ height: '100%' }}>
            <div className="modern-card-header">
              <h3>{t('analytics.monthlyRevenue')}</h3>
            </div>
            <div className="modern-card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 180, paddingTop: 16 }}>
                {monthlyRevenue.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>
                      {formatMoney(item.value)}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 40,
                        height: `${(item.value / maxRevenue) * 130}px`,
                        background: 'linear-gradient(to top, var(--primary-500), var(--primary-300))',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.5s ease',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 6 }}>{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>

        {/* Chart 2: Appointment Source Pie Chart */}
        <Col xs={24} md={8}>
          <div className="modern-card" style={{ height: '100%' }}>
            <div className="modern-card-header">
              <h3>{t('analytics.appointmentSources')}</h3>
            </div>
            <div className="modern-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: pieGradient,
                  marginBottom: 16,
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center' }}>
                {PIE_KEYS.map((seg, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{t(seg.key)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)' }}>{seg.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>

        {/* Chart 3: Service Category Distribution */}
        <Col xs={24} md={8}>
          <div className="modern-card" style={{ height: '100%' }}>
            <div className="modern-card-header">
              <h3>{t('analytics.popularServices')}</h3>
            </div>
            <div className="modern-card-body">
              {SERVICE_KEYS.map((svc, idx) => (
                <div key={idx} style={{ marginBottom: idx < SERVICE_KEYS.length - 1 ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)' }}>{t(svc.key)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>{svc.count}</span>
                  </div>
                  <Progress
                    percent={Math.round((svc.count / serviceMax) * 100)}
                    showInfo={false}
                    strokeColor="var(--primary-500)"
                    trailColor="var(--gray-100)"
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* Doctor performance table */}
      <div className="modern-card">
        <div className="modern-card-header">
          <h3>{t('analytics.doctorStats')}</h3>
        </div>
        <div className="modern-card-body">
          <Table
            columns={columns}
            dataSource={doctorStats.map((d, i) => ({ ...d, key: d.doctorId || i }))}
            pagination={false}
            size="middle"
            loading={docLoading}
            locale={{ emptyText: t('common.noData') }}
            scroll={{ x: 800 }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

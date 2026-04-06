import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import { useDashboard } from '../../../hooks';

interface WelcomeBannerProps {
  stats?: { label: string; value: string | number }[];
}

const formatMoney = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ stats: statsProp }) => {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'doctor';
  const { data: dashboard } = useDashboard(role);
  const userName = user ? `${user.firstName} ${user.lastName}` : t('common.user');

  const currentDate = new Date();
  const dateLocale = i18n.language === 'tj' ? 'tg-TJ' : 'ru-RU';
  const formattedDate = currentDate.toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Role-specific stat values from the API
  const roleStats: Record<string, { label: string; value: string | number }[]> = {
    owner: [
      { label: t('dashboard.todayAppointments'), value: dashboard?.todayAppointments ?? '—' },
      { label: t('dashboard.doctorsInSystem'), value: dashboard?.totalDoctors ?? '—' },
      { label: t('dashboard.totalPatients'), value: dashboard?.totalPatients ?? '—' },
    ],
    reception: [
      { label: t('dashboard.todayAppointments'), value: dashboard?.todayAppointments ?? '—' },
      { label: t('dashboard.awaitingConfirmation'), value: dashboard?.pendingConfirmation ?? '—' },
      { label: t('dashboard.inQueue'), value: dashboard?.inQueue ?? '—' },
    ],
    accountant: [
      { label: t('dashboard.monthRevenue'), value: dashboard?.monthRevenue ? formatMoney(dashboard.monthRevenue) : '—' },
      { label: t('dashboard.unpaidInvoices'), value: dashboard?.unpaidInvoices ?? '—' },
      { label: t('dashboard.monthExpenses'), value: dashboard?.monthExpenses ? formatMoney(dashboard.monthExpenses) : '—' },
    ],
    doctor: [
      { label: t('dashboard.todayAppointments'), value: dashboard?.todayAppointments ?? '—' },
      { label: t('dashboard.totalPatients'), value: dashboard?.totalPatients ?? '—' },
      { label: t('dashboard.doctorsOnShift'), value: dashboard?.totalDoctors ?? '—' },
    ],
    nurse: [
      { label: t('dashboard.todayAppointments'), value: dashboard?.todayAppointments ?? '—' },
      { label: t('dashboard.totalPatients'), value: dashboard?.totalPatients ?? '—' },
      { label: t('dashboard.doctorsOnShift'), value: dashboard?.totalDoctors ?? '—' },
    ],
    chief_doctor: [
      { label: t('dashboard.todayAppointments'), value: dashboard?.todayAppointments ?? '—' },
      { label: t('dashboard.doctorsOnShift'), value: dashboard?.totalDoctors ?? '—' },
      { label: t('dashboard.totalPatients'), value: dashboard?.totalPatients ?? '—' },
    ],
  };

  const defaultStats = roleStats.owner;
  const displayStats = statsProp || roleStats[role] || defaultStats;

  return (
    <div className="welcome-banner">
      <h2>{t('dashboard.goodDay')}, {userName} 👋</h2>
      <p style={{ textTransform: 'capitalize' }}>
        {t(`roles.${role}`)} &middot; {formattedDate}
      </p>
      <div className="welcome-stats">
        {displayStats.map((stat, i) => (
          <div className="welcome-stat" key={i}>
            <div className="welcome-stat-value">{stat.value}</div>
            <div className="welcome-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeBanner;

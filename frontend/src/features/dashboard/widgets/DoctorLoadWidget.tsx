import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from 'antd';
import { useDoctorLoad } from '../../../hooks';

const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];

const DoctorLoadWidget: React.FC = () => {
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = `${today.substring(0, 7)}-01`;
  const { data } = useDoctorLoad({ dateFrom: monthStart, dateTo: today });

  const doctors = Array.isArray(data) ? data : [];

  return (
    <div className="modern-card" style={{ marginBottom: 20 }}>
      <div className="modern-card-header">
        <h3>{t('dashboard.doctorLoad')}</h3>
      </div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {doctors.length === 0 && (
            <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 12 }}>{t('common.noData')}</div>
          )}
          {doctors.slice(0, 6).map((doc: any, i: number) => {
            const completed = Number(doc.completedAppointments || 0);
            const total = Number(doc.totalAppointments || 0);
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={doc.doctorId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                <Avatar
                  size={32}
                  style={{ background: avatarColors[i % 5], fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                >
                  {String(doc.doctorName || '?').charAt(0)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)' }}>{doc.doctorName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{doc.specialty || t('roles.doctor')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>{total}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{pct}% {t('dashboard.completed')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DoctorLoadWidget;

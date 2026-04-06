import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col } from 'antd';
import { useDashboard, useTrends } from '../../../hooks';
import { getCurrencySymbol } from '../../../utils/format';

const formatMoney = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

const RevenueChart: React.FC = () => {
  const { t } = useTranslation();
  const chartLabels = [
    t('common.monthJanShort'), t('common.monthFebShort'), t('common.monthMarShort'),
    t('common.monthAprShort'), t('common.monthMayShort'), t('common.monthJunShort'),
    t('common.monthJulShort'), t('common.monthAugShort'), t('common.monthSepShort'),
    t('common.monthOctShort'), t('common.monthNovShort'), t('common.monthDecShort'),
  ];
  const { data: dashboard } = useDashboard();
  const { data: trends } = useTrends(12);

  // Build chart bars from trends data
  const revenueByMonth: number[] = new Array(12).fill(0);
  if (trends?.revenue) {
    for (const item of trends.revenue as { month: string; revenue: string }[]) {
      const monthIdx = parseInt(item.month.split('-')[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        revenueByMonth[monthIdx] = Number(item.revenue || 0);
      }
    }
  }
  const maxRevenue = Math.max(...revenueByMonth, 1);
  const chartBars = revenueByMonth.map((v) => Math.max((v / maxRevenue) * 100, 3));

  return (
    <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
      <Col xs={24} lg={16}>
        <div className="modern-card">
          <div className="modern-card-header">
            <h3>{t('dashboard.yearRevenue')}</h3>
          </div>
          <div className="modern-card-body">
            <div className="mini-chart" style={{ height: 220, paddingBottom: 32 }}>
              {chartBars.map((h, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div
                    className={`mini-chart-bar ${i === new Date().getMonth() ? 'blue' : 'light'}`}
                    style={{ height: `${h}%` }}
                    title={`${chartLabels[i]}: ${formatMoney(revenueByMonth[i])} ${getCurrencySymbol()}`}
                  />
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{chartLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Col>
      <Col xs={24} lg={8}>
        <div className="modern-card" style={{ height: '100%' }}>
          <div className="modern-card-header">
            <h3>{t('dashboard.byDepartment')}</h3>
          </div>
          <div className="modern-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="mini-donut">
              <div className="mini-donut-center">
                <div className="mini-donut-center-value">{dashboard?.monthRevenue ? formatMoney(dashboard.monthRevenue) : '—'}</div>
                <div className="mini-donut-center-label">{getCurrencySymbol()}</div>
              </div>
            </div>
            <div className="chart-legend" style={{ marginTop: 20, justifyContent: 'center' }}>
              {[
                { label: t('dashboard.therapy'), color: 'var(--primary-500)' },
                { label: t('dashboard.ultrasound'), color: 'var(--accent-500)' },
                { label: t('dashboard.cardiology'), color: 'var(--warm-500)' },
                { label: t('dashboard.laboratory'), color: 'var(--purple-500)' },
                { label: t('dashboard.other'), color: 'var(--gray-300)' },
              ].map(item => (
                <div className="chart-legend-item" key={item.label}>
                  <div className="chart-legend-dot" style={{ background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default RevenueChart;

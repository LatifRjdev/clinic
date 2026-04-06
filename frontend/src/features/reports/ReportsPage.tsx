import React, { useState } from 'react';
import { Row, Col, DatePicker, Select, Space, Spin, Button } from 'antd';
import { DollarOutlined, BarChartOutlined, FundOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../api/services/reports.service';
import { formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [reportType, setReportType] = useState('profit-loss');

  const params = { dateFrom, dateTo };

  const { data: revenue, isLoading: revLoading } = useQuery({ queryKey: ['reports', 'revenue', params], queryFn: () => reportsService.getRevenue(params) });
  const { data: expenses, isLoading: expLoading } = useQuery({ queryKey: ['reports', 'expenses', params], queryFn: () => reportsService.getExpenses(params) });
  const { data: profitLoss, isLoading: plLoading } = useQuery({ queryKey: ['reports', 'profit-loss', params], queryFn: () => reportsService.getProfitLoss(params) });

  const isLoading = revLoading || expLoading || plLoading;

  const fmt = (v: number) => formatCurrency(v || 0);

  const revenueData = revenue as { total?: number } | undefined;
  const expensesData = expenses as { total?: number; byCategory?: Array<{ category: string; total: number }> } | undefined;
  const plData = profitLoss as { revenue?: number; expenses?: number; profit?: number } | undefined;

  const handleExportCSV = () => {
    const rows: string[][] = [
      [t('reports.indicator'), t('reports.value')],
      [t('reports.revenue'), String(revenueData?.total || plData?.revenue || 0)],
      [t('reports.expenses'), String(expensesData?.total || plData?.expenses || 0)],
      [t('reports.profit'), String(plData?.profit || 0)],
    ];

    if (expensesData?.byCategory) {
      rows.push([]);
      rows.push([t('reports.expensesByCategory'), '']);
      expensesData.byCategory.forEach((item) => {
        rows.push([item.category, String(item.total)]);
      });
    }

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${dateFrom}_${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const revenueVal = revenueData?.total || plData?.revenue || 0;
    const expensesVal = expensesData?.total || plData?.expenses || 0;
    const profitVal = plData?.profit || 0;

    const categoryRows = (expensesData?.byCategory || [])
      .map(
        (item) =>
          `<tr><td style="padding:8px 12px;border:1px solid #ddd">${item.category}</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:right">${formatCurrency(item.total)}</td></tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('reports.financialReport')}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#333}
        h1{font-size:20px;text-align:center;margin-bottom:4px}
        .date-range{text-align:center;color:#666;font-size:14px;margin-bottom:24px}
        .summary{display:flex;justify-content:space-between;margin-bottom:24px;gap:16px}
        .summary-item{flex:1;padding:16px;border:1px solid #e0e0e0;border-radius:8px;text-align:center}
        .summary-label{font-size:12px;color:#888;margin-bottom:4px}
        .summary-value{font-size:18px;font-weight:bold}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th{background:#f5f5f5;font-weight:600;padding:8px 12px;border:1px solid #ddd;text-align:left}
        h2{font-size:16px;margin-top:24px}
        @media print{body{padding:20px}}
      </style></head><body>
      <h1>${t('reports.financialReport')}</h1>
      <div class="date-range">${dateFrom} — ${dateTo}</div>
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">${t('reports.revenue')}</div>
          <div class="summary-value" style="color:#52c41a">${formatCurrency(revenueVal)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">${t('reports.expenses')}</div>
          <div class="summary-value" style="color:#ff4d4f">${formatCurrency(expensesVal)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">${t('reports.profit')}</div>
          <div class="summary-value" style="color:${profitVal >= 0 ? '#1677ff' : '#ff4d4f'}">${formatCurrency(profitVal)}</div>
        </div>
      </div>
      ${
        categoryRows
          ? `<h2>${t('reports.expensesByCategory')}</h2>
             <table><thead><tr><th>${t('reports.categoryName')}</th><th style="text-align:right">${t('reports.amount')}</th></tr></thead>
             <tbody>${categoryRows}</tbody></table>`
          : ''
      }
      </body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><BarChartOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('reports.title')}</h2>
        <Space wrap>
          <RangePicker
            defaultValue={[dayjs(dateFrom), dayjs(dateTo)]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateFrom(dates[0].format('YYYY-MM-DD'));
                setDateTo(dates[1].format('YYYY-MM-DD'));
              }
            }}
          />
          <Select value={reportType} onChange={setReportType} style={{ minWidth: 160, maxWidth: 220, width: '100%' }}
            options={[
              { value: 'profit-loss', label: t('reports.profitAndLoss') },
              { value: 'revenue', label: t('reports.revenue') },
              { value: 'expenses', label: t('reports.expenses') },
            ]} />
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={isLoading}>
            {t('reports.exportCSV')}
          </Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} disabled={isLoading}>
            {t('reports.printReport')}
          </Button>
        </Space>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>
      ) : (
        <>
          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}>
              <div className="stat-card">
                <div className="stat-card-icon green"><DollarOutlined /></div>
                <div className="stat-card-value" style={{ fontSize: 20 }}>{fmt(revenueData?.total || plData?.revenue || 0)}</div>
                <div className="stat-card-label">{t('reports.revenue')}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="stat-card">
                <div className="stat-card-icon red"><DollarOutlined /></div>
                <div className="stat-card-value" style={{ fontSize: 20 }}>{fmt(expensesData?.total || plData?.expenses || 0)}</div>
                <div className="stat-card-label">{t('reports.expenses')}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="stat-card">
                <div className="stat-card-icon blue"><FundOutlined /></div>
                <div className="stat-card-value" style={{ fontSize: 20, color: (plData?.profit || 0) >= 0 ? 'var(--accent-600)' : 'var(--danger-500)' }}>
                  {fmt(plData?.profit || 0)}
                </div>
                <div className="stat-card-label">{t('reports.profit')}</div>
              </div>
            </Col>
          </Row>

          {expensesData?.byCategory && (
            <div className="modern-card">
              <div className="modern-card-header"><h3>{t('reports.expensesByCategory')}</h3></div>
              <div className="modern-card-body">
                {expensesData.byCategory.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ fontWeight: 500 }}>{item.category}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;

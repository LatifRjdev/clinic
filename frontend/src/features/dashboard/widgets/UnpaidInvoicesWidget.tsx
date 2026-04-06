import React from 'react';
import { useTranslation } from 'react-i18next';
import { RightOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesService } from '../../../api/services/billing.service';
import { formatCurrency } from '../../../utils/format';
import type { Invoice } from '../../../types';

const UnpaidInvoicesWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['invoices', 'unpaid'],
    queryFn: () => invoicesService.findAll({ status: 'pending', limit: 5 }),
  });

  const invoices: Invoice[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="modern-card" style={{ marginBottom: 20 }}>
      <div className="modern-card-header">
        <h3>{t('dashboard.unpaidInvoices')}</h3>
        <span
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--primary-600)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
          onClick={() => navigate('/billing/invoices')}
        >
          {t('dashboard.allInvoices')} <RightOutlined style={{ fontSize: 10 }} />
        </span>
      </div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {invoices.length === 0 && (
            <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 12 }}>{t('dashboard.allPaid')}</div>
          )}
          {invoices.slice(0, 5).map((inv) => (
            <div className="task-item" key={inv.id}>
              <DollarOutlined style={{ color: '#f59e0b', fontSize: 14 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="task-item-title">{inv.invoiceNumber}</div>
                <div className="task-item-meta">{formatCurrency(inv.finalAmount, { decimals: 0 })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnpaidInvoicesWidget;

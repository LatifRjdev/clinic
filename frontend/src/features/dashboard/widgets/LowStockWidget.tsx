import React from 'react';
import { useTranslation } from 'react-i18next';
import { WarningOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLowStock } from '../../../hooks';
import type { InventoryItem } from '../../../types';

const LowStockWidget: React.FC = () => {
  const { t } = useTranslation();
  const { data } = useLowStock();
  const navigate = useNavigate();

  const items: InventoryItem[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="modern-card" style={{ marginBottom: 20 }}>
      <div className="modern-card-header">
        <h3>{t('dashboard.lowStockTitle')}</h3>
        <span
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--primary-600)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
          onClick={() => navigate('/inventory')}
        >
          {t('dashboard.allStock')} <RightOutlined style={{ fontSize: 10 }} />
        </span>
      </div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.length === 0 && (
            <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 12 }}>{t('dashboard.allNormal')}</div>
          )}
          {items.slice(0, 5).map((item) => (
            <div className="task-item" key={item.id}>
              <WarningOutlined style={{ color: item.quantity === 0 ? '#ef4444' : '#f59e0b', fontSize: 14 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="task-item-title">{item.name}</div>
                <div className="task-item-meta">
                  {t('dashboard.remainder')}: {item.quantity} {item.unit} ({t('dashboard.min')}: {item.minQuantity})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LowStockWidget;

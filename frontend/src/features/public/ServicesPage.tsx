import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Spin, Empty, Tabs, Button } from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePublicServices } from '../../hooks/usePublic';
import { formatCurrency } from '../../utils/format';

interface ServiceItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  price: number;
  duration: number;
}

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: services, isLoading } = usePublicServices(selectedCategory);

  const categories = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    const cats = new Set<string>();
    services.forEach((s: ServiceItem) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [services]);

  const groupedServices = useMemo(() => {
    if (!services || !Array.isArray(services)) return {};
    const grouped: Record<string, ServiceItem[]> = {};
    services.forEach((s: ServiceItem) => {
      const cat = s.category || t('public.otherCategory', 'Другие');
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    return grouped;
  }, [services, t]);

  const tabItems = useMemo(() => {
    const allTab = {
      key: '__all__',
      label: t('public.allCategories', 'Все'),
    };
    const catTabs = categories.map((cat) => ({
      key: cat,
      label: cat,
    }));
    return [allTab, ...catTabs];
  }, [categories, t]);

  const handleTabChange = (key: string) => {
    setSelectedCategory(key === '__all__' ? undefined : key);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="public-section">
      <div style={{ marginBottom: 32 }}>
        <h1 className="public-section-title">{t('public.ourServices', 'Наши услуги')}</h1>
        <p className="public-section-subtitle">
          {t('public.servicesSubtitle', 'Полный перечень медицинских услуг нашей клиники')}
        </p>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <Tabs
          activeKey={selectedCategory ?? '__all__'}
          onChange={handleTabChange}
          items={tabItems}
          style={{ marginBottom: 32 }}
        />
      )}

      {/* Services grouped by category */}
      {!services || services.length === 0 ? (
        <Empty description={t('public.noServices', 'Услуги не найдены')} />
      ) : (
        Object.entries(groupedServices).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--gray-800)',
                marginBottom: 20,
                paddingBottom: 8,
                borderBottom: '2px solid var(--primary-100)',
              }}
            >
              {category}
            </h2>
            <Row gutter={[20, 20]}>
              {items.map((service) => (
                <Col xs={24} sm={12} md={8} key={service.id}>
                  <div
                    className="modern-card"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <div className="modern-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Service name */}
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--gray-900)',
                          marginBottom: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        {service.name}
                      </h3>

                      {/* Code */}
                      {service.code && (
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: 'var(--gray-400)',
                            marginBottom: 12,
                          }}
                        >
                          {service.code}
                        </div>
                      )}

                      {/* Duration */}
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--gray-500)',
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <ClockCircleOutlined />
                        {service.duration} {t('public.minutes', 'минут')}
                      </div>

                      {/* Price */}
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: 'var(--primary-600)',
                          marginBottom: 16,
                          marginTop: 'auto',
                        }}
                      >
                        {formatCurrency(service.price, { decimals: 0 })}
                      </div>

                      {/* Book button */}
                      <Button
                        type="primary"
                        block
                        icon={<CalendarOutlined />}
                        onClick={() => navigate('/book')}
                      >
                        {t('public.bookAppointment', 'Записаться')}
                      </Button>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}
    </div>
  );
};

export default ServicesPage;

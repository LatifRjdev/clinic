import React from 'react';
import { Row, Col, Typography, Skeleton } from 'antd';
import {
  MedicineBoxOutlined,
  HeartOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePublicStats } from '../../hooks/usePublic';

const { Title, Text, Paragraph } = Typography;

const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: statsData, isLoading: statsLoading } = usePublicStats();

  const values = [
    {
      icon: <TrophyOutlined style={{ fontSize: 32, color: 'var(--primary-500)' }} />,
      title: t('about.valueProfessionalismTitle'),
      description: t('about.valueProfessionalismDesc'),
    },
    {
      icon: <HeartOutlined style={{ fontSize: 32, color: '#ef4444' }} />,
      title: t('about.valueCareTitle'),
      description: t('about.valueCareDesc'),
    },
    {
      icon: <ExperimentOutlined style={{ fontSize: 32, color: '#8b5cf6' }} />,
      title: t('about.valueTechTitle'),
      description: t('about.valueTechDesc'),
    },
  ];

  const stats = [
    { value: statsData ? `${statsData.patientCount}+` : '1000+', label: t('public.statsPatients') },
    { value: statsData ? `${statsData.doctorCount}+` : '20+', label: t('public.statsDoctors') },
    { value: statsData ? `${statsData.serviceCount}` : '15', label: t('public.statsServices') },
    { value: statsData ? `${statsData.yearsActive}+` : '10+', label: t('public.statsYears') },
  ];

  return (
    <div>
      {/* Hero mini-section */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500, #8b5cf6))',
          padding: '64px 32px',
          textAlign: 'center',
          color: 'white',
          borderRadius: '0 0 24px 24px',
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <MedicineBoxOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.9 }} />
          <Title
            level={2}
            style={{
              color: 'white',
              margin: '0 0 12px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {t('about.title')}
          </Title>
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            {t('about.subtitle')}
          </Text>
        </div>
      </div>

      {/* History section */}
      <div className="public-section">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--primary-50, #eff6ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryOutlined
                style={{ fontSize: 22, color: 'var(--primary-500)' }}
              />
            </div>
            <Title
              level={3}
              style={{
                margin: 0,
                fontWeight: 700,
                color: 'var(--gray-800)',
              }}
            >
              {t('about.historyTitle')}
            </Title>
          </div>

          <Paragraph
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: 'var(--gray-600)',
              marginBottom: 16,
            }}
          >
            {t('about.historyP1')}
          </Paragraph>

          <Paragraph
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: 'var(--gray-600)',
              marginBottom: 16,
            }}
          >
            {t('about.historyP2')}
          </Paragraph>

          <Paragraph
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: 'var(--gray-600)',
            }}
          >
            {t('about.historyP3')}
          </Paragraph>
        </div>
      </div>

      {/* Mission & Values */}
      <div
        style={{
          background: 'var(--gray-50)',
          padding: '64px 32px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Title
              level={3}
              style={{
                fontWeight: 800,
                color: 'var(--gray-800)',
                marginBottom: 8,
              }}
            >
              {t('about.valuesTitle')}
            </Title>
            <Text style={{ color: 'var(--gray-500)', fontSize: 16 }}>
              {t('about.valuesSubtitle')}
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {values.map((item, idx) => (
              <Col xs={24} md={8} key={idx}>
                <div
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '32px 24px',
                    textAlign: 'center',
                    height: '100%',
                    border: '1px solid var(--gray-100)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform 200ms, box-shadow 200ms',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: 'var(--gray-50)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 20,
                    }}
                  >
                    {item.icon}
                  </div>
                  <Title
                    level={4}
                    style={{
                      margin: '0 0 12px',
                      fontWeight: 700,
                      color: 'var(--gray-800)',
                    }}
                  >
                    {item.title}
                  </Title>
                  <Text
                    style={{
                      color: 'var(--gray-500)',
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    {item.description}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Stats section */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500, #8b5cf6))',
          padding: '48px 32px',
        }}
      >
        <Row
          gutter={[24, 24]}
          justify="center"
          style={{ maxWidth: 900, margin: '0 auto' }}
        >
          {statsLoading
            ? [0, 1, 2, 3].map((idx) => (
                <Col xs={12} md={6} key={idx}>
                  <div style={{ textAlign: 'center' }}>
                    <Skeleton.Input active style={{ width: 80, height: 36 }} />
                    <div style={{ marginTop: 4 }}>
                      <Skeleton.Input active style={{ width: 60, height: 14 }} />
                    </div>
                  </div>
                </Col>
              ))
            : stats.map((stat, idx) => (
                <Col xs={12} md={6} key={idx}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: 'white',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.8)',
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                </Col>
              ))}
        </Row>
      </div>

      {/* Certifications */}
      <div className="public-section">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--primary-50, #eff6ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SafetyCertificateOutlined
                style={{ fontSize: 22, color: 'var(--primary-500)' }}
              />
            </div>
            <Title
              level={3}
              style={{
                margin: 0,
                fontWeight: 700,
                color: 'var(--gray-800)',
              }}
            >
              {t('about.certificationsTitle')}
            </Title>
          </div>

          <div
            style={{
              background: 'var(--gray-50)',
              borderRadius: 16,
              padding: '24px 28px',
              border: '1px solid var(--gray-100)',
            }}
          >
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
              <StarOutlined style={{ fontSize: 18, color: 'var(--primary-500)', marginTop: 3 }} />
              <Paragraph style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: 'var(--gray-600)' }}>
                {t('about.certLicense')}
              </Paragraph>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
              <TeamOutlined style={{ fontSize: 18, color: 'var(--primary-500)', marginTop: 3 }} />
              <Paragraph style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: 'var(--gray-600)' }}>
                {t('about.certSpecialists')}
              </Paragraph>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <SafetyCertificateOutlined style={{ fontSize: 18, color: 'var(--primary-500)', marginTop: 3 }} />
              <Paragraph style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: 'var(--gray-600)' }}>
                {t('about.certEquipment')}
              </Paragraph>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

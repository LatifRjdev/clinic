import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Row, Col, Collapse } from 'antd';
import {
  HeartOutlined,
  ExperimentOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  CalendarOutlined,
  SmileOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { usePublicDoctors, usePublicStats } from '../../hooks/usePublic';
import DoctorCard from './components/DoctorCard';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: doctors, isLoading } = usePublicDoctors();
  const { data: statsData } = usePublicStats();

  const serviceCategories = [
    { icon: <HeartOutlined />, name: t('public.categoryCardiology') },
    { icon: <ExperimentOutlined />, name: t('public.categoryLaboratory') },
    { icon: <EyeOutlined />, name: t('public.categoryOphthalmology') },
    { icon: <MedicineBoxOutlined />, name: t('public.categoryTherapy') },
    { icon: <SmileOutlined />, name: t('public.categoryDentistry') },
    { icon: <SafetyCertificateOutlined />, name: t('public.categoryNeurology') },
  ];

  const steps = [
    { icon: <UserOutlined />, title: t('public.stepSelectDoctor'), step: 1 },
    { icon: <CalendarOutlined />, title: t('public.stepSelectTime'), step: 2 },
    { icon: <HeartOutlined />, title: t('public.stepGetCare'), step: 3 },
  ];

  const stats = [
    { number: statsData ? `${statsData.patientCount}+` : '1000+', label: t('public.statsPatients') },
    { number: statsData ? `${statsData.doctorCount}+` : '20+', label: t('public.statsDoctors') },
    { number: statsData ? `${statsData.serviceCount}+` : '50+', label: t('public.statsServices') },
    { number: statsData ? `${statsData.yearsActive}+` : '10+', label: t('public.statsYears') },
  ];

  const faqItems = [
    { key: '1', label: t('public.faqHowToBook'), children: <p>{t('public.faqHowToBookAnswer')}</p> },
    { key: '2', label: t('public.faqDocuments'), children: <p>{t('public.faqDocumentsAnswer')}</p> },
    { key: '3', label: t('public.faqInsurance'), children: <p>{t('public.faqInsuranceAnswer')}</p> },
    { key: '4', label: t('public.faqCancel'), children: <p>{t('public.faqCancelAnswer')}</p> },
    { key: '5', label: t('public.faqPayment'), children: <p>{t('public.faqPaymentAnswer')}</p> },
    { key: '6', label: t('public.faqResults'), children: <p>{t('public.faqResultsAnswer')}</p> },
  ];

  const featuredDoctors = Array.isArray(doctors) ? doctors.slice(0, 4) : [];

  return (
    <div>
      {/* Hero Section */}
      <section className="public-hero">
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
          <h1 className="public-hero-title" style={{
            fontSize: 42,
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
          }}>
            {t('public.heroTitle')}
          </h1>
          <p style={{
            fontSize: 18,
            opacity: 0.9,
            marginBottom: 36,
            lineHeight: 1.6,
          }}>
            {t('public.heroSubtitle')}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/book')}
              style={{
                height: 48,
                padding: '0 32px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
                background: 'white',
                color: 'var(--primary-600)',
                border: 'none',
              }}
            >
              {t('public.bookAppointment')}
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/doctors')}
              style={{
                height: 48,
                padding: '0 32px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
                background: 'transparent',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
              }}
            >
              {t('public.featuredDoctors')}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{
        padding: '0 16px',
        maxWidth: 1200,
        margin: '-40px auto 0',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20,
        }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{
              background: 'white',
              borderRadius: 16,
              padding: '28px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              border: '1px solid var(--gray-100)',
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: 'var(--primary-600)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {stat.number}
              </div>
              <div style={{
                fontSize: 14,
                color: 'var(--gray-500)',
                fontWeight: 500,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Services Section */}
      <section className="public-section" style={{ paddingTop: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="public-section-title">{t('public.ourServices')}</h2>
          <p className="public-section-subtitle">
            {t('public.clinicDescription')}
          </p>
        </div>
        <Row gutter={[24, 24]}>
          {serviceCategories.map((service, idx) => (
            <Col xs={12} sm={8} md={8} key={idx}>
              <div
                onClick={() => navigate('/services')}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '1px solid var(--gray-100)',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: 28,
                  color: 'var(--primary-500)',
                }}>
                  {service.icon}
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--gray-800)',
                }}>
                  {service.name}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* Featured Doctors Section */}
      <section className="public-section" style={{ background: 'var(--gray-50)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="public-section-title">{t('public.featuredDoctors')}</h2>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <TeamOutlined style={{ fontSize: 32, color: 'var(--gray-300)' }} spin />
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {featuredDoctors.map((doctor: any) => (
                <Col xs={24} sm={12} md={8} lg={6} key={doctor.id}>
                  <DoctorCard doctor={doctor} />
                </Col>
              ))}
            </Row>
          )}
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Button
              type="link"
              size="large"
              onClick={() => navigate('/doctors')}
              style={{ fontSize: 16, fontWeight: 600 }}
            >
              {t('public.viewAllDoctors')} <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="public-section">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="public-section-title">{t('public.howItWorks')}</h2>
        </div>
        <Row gutter={[32, 32]} align="middle">
          {steps.map((step, idx) => (
            <Col xs={24} sm={8} key={idx}>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                {/* Step number */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--primary-100)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  {step.step}
                </div>
                {/* Icon circle */}
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 32,
                  color: 'white',
                }}>
                  {step.icon}
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--gray-800)',
                }}>
                  {step.title}
                </div>
                {/* Arrow between steps (desktop only) */}
                {idx < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: -16,
                    transform: 'translateY(-50%)',
                    fontSize: 24,
                    color: 'var(--gray-300)',
                  }}
                    className="hide-on-mobile"
                  >
                    <ArrowRightOutlined />
                  </div>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* FAQ Section */}
      <section className="public-section" style={{ background: 'var(--gray-50)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="public-section-title">{t('public.faqTitle')}</h2>
          </div>
          <Collapse
            items={faqItems}
            bordered={false}
            expandIconPosition="end"
            style={{
              background: 'transparent',
            }}
            className="public-faq-collapse"
          />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="public-cta-banner" style={{
        padding: '64px 32px',
        background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500))',
        textAlign: 'center',
        color: 'white',
      }}>
        <h2 className="public-cta-title" style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 12,
          letterSpacing: '-0.02em',
        }}>
          {t('public.readyToBook')}
        </h2>
        <p style={{
          fontSize: 16,
          opacity: 0.9,
          marginBottom: 32,
          maxWidth: 500,
          margin: '0 auto 32px',
        }}>
          {t('public.readyToBookSubtitle')}
        </p>
        <Button
          size="large"
          onClick={() => navigate('/book')}
          style={{
            height: 48,
            padding: '0 36px',
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 12,
            background: 'white',
            color: 'var(--primary-600)',
            border: 'none',
          }}
        >
          {t('public.bookNow')} <ArrowRightOutlined />
        </Button>
      </section>

      <style>{`
        @media (max-width: 576px) {
          .public-hero-title {
            font-size: 28px !important;
          }
          .public-cta-banner {
            padding: 40px 16px !important;
          }
          .public-cta-title {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;

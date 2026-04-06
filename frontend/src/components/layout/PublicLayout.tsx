import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MenuOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const MOBILE_BREAKPOINT = 768;

const PublicLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [lang, setLang] = useState<'RU' | 'TJ' | 'EN'>(
    i18n.language === 'tj' ? 'TJ' : i18n.language === 'en' ? 'EN' : 'RU'
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const switchLang = (l: 'RU' | 'TJ' | 'EN') => {
    setLang(l);
    const code = l === 'TJ' ? 'tj' : l === 'EN' ? 'en' : 'ru';
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  const navLinks = [
    { path: '/', label: t('public.home') },
    { path: '/doctors', label: t('public.doctors') },
    { path: '/services', label: t('public.services') },
    { path: '/about', label: t('public.about') },
    { path: '/contact', label: t('public.contact') },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header className="public-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 20,
          }}>
            <MedicineBoxOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>MedClinic</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: -2 }}>{t('app.subtitle')}</div>
          </div>
        </div>

        {/* Desktop Nav */}
        {!isMobile && (
          <nav className="public-nav" style={{ flex: 1, justifyContent: 'center' }}>
            {navLinks.map((link) => (
              <span
                key={link.path}
                className={`public-nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </span>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <>
              <div className="header-lang-switch">
                <button
                  className={`header-lang-btn ${lang === 'RU' ? 'active' : ''}`}
                  onClick={() => switchLang('RU')}
                >
                  RU
                </button>
                <button
                  className={`header-lang-btn ${lang === 'TJ' ? 'active' : ''}`}
                  onClick={() => switchLang('TJ')}
                >
                  TJ
                </button>
                <button
                  className={`header-lang-btn ${lang === 'EN' ? 'active' : ''}`}
                  onClick={() => switchLang('EN')}
                >
                  EN
                </button>
              </div>

              <button
                onClick={() => navigate('/book')}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '8px 20px', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 200ms',
                }}
              >
                {t('public.bookAppointment')}
              </button>

              <button
                onClick={() => navigate('/patient-login')}
                style={{
                  background: 'transparent',
                  color: 'var(--primary-600)', border: '1px solid var(--primary-200)',
                  borderRadius: 10, padding: '8px 20px', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', transition: 'all 200ms',
                }}
              >
                {t('public.patientLogin')}
              </button>
            </>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 22, color: 'var(--gray-700)', padding: 4,
              }}
            >
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 98, backdropFilter: 'blur(2px)',
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            style={{
              position: 'fixed', top: 70, right: 0, bottom: 0,
              width: 280, background: 'white', zIndex: 99,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
              padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 8,
              overflowY: 'auto',
            }}
          >
            {navLinks.map((link) => (
              <div
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 500, fontSize: 15,
                  color: isActive(link.path) ? 'var(--primary-600)' : 'var(--gray-700)',
                  background: isActive(link.path) ? 'var(--primary-50)' : 'transparent',
                }}
              >
                {link.label}
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--gray-100)', margin: '12px 0' }} />

            <div className="header-lang-switch" style={{ justifyContent: 'center', marginBottom: 12 }}>
              <button
                className={`header-lang-btn ${lang === 'RU' ? 'active' : ''}`}
                onClick={() => switchLang('RU')}
              >
                RU
              </button>
              <button
                className={`header-lang-btn ${lang === 'TJ' ? 'active' : ''}`}
                onClick={() => switchLang('TJ')}
              >
                TJ
              </button>
              <button
                className={`header-lang-btn ${lang === 'EN' ? 'active' : ''}`}
                onClick={() => switchLang('EN')}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => navigate('/book')}
              style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '12px 20px', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', width: '100%',
              }}
            >
              {t('public.bookAppointment')}
            </button>

            <button
              onClick={() => navigate('/patient-login')}
              style={{
                background: 'transparent',
                color: 'var(--primary-600)', border: '1px solid var(--primary-200)',
                borderRadius: 10, padding: '12px 20px', fontSize: 15,
                fontWeight: 600, cursor: 'pointer', width: '100%',
              }}
            >
              {t('public.patientLogin')}
            </button>
          </div>
        </>
      )}

      {/* Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="public-footer-grid">
          {/* Column 1: Clinic Info */}
          <div>
            <div className="public-footer-title">MedClinic</div>
            <p style={{ color: 'var(--gray-400)', fontSize: 14, lineHeight: 1.7 }}>
              {t('public.clinicDescription')}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <div className="public-footer-title">{t('public.quickLinks')}</div>
            {navLinks.map((link) => (
              <span
                key={link.path}
                className="public-footer-link"
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </span>
            ))}
          </div>

          {/* Column 3: Contact */}
          <div>
            <div className="public-footer-title">{t('public.contactInfo')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="public-footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EnvironmentOutlined /> {t('public.address')}
              </span>
              <span className="public-footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneOutlined /> +992 (44) 600-00-00
              </span>
              <span className="public-footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailOutlined /> info@medclinic.tj
              </span>
            </div>
          </div>

          {/* Column 4: Working Hours */}
          <div>
            <div className="public-footer-title">{t('public.workingHours')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="public-footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined /> {t('common.monFri')}: 8:00 - 18:00
              </span>
              <span className="public-footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined /> {t('common.sat')}: 9:00 - 14:00
              </span>
            </div>
          </div>
        </div>

        <div className="public-footer-bottom">
          {t('public.copyright')}
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

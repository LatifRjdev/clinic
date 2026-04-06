import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MedicineBoxOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

const KEYFRAMES = `
@keyframes loginGradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes loginFloat1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25%  { transform: translate(30px, -40px) rotate(5deg); }
  50%  { transform: translate(-20px, -70px) rotate(-3deg); }
  75%  { transform: translate(15px, -30px) rotate(4deg); }
}
@keyframes loginFloat2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33%  { transform: translate(-40px, -30px) rotate(-6deg); }
  66%  { transform: translate(20px, -60px) rotate(3deg); }
}
@keyframes loginFloat3 {
  0%, 100% { transform: translate(0, 0); }
  50%  { transform: translate(25px, -50px); }
}
@keyframes loginCardEntrance {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes loginPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50%  { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
}
`;

const floatingShapes: Array<{
  size: number;
  top: string;
  left: string;
  animation: string;
  opacity: number;
  borderRadius: string;
  background: string;
}> = [
  {
    size: 300,
    top: '-5%',
    left: '-8%',
    animation: 'loginFloat1 18s ease-in-out infinite',
    opacity: 0.12,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  },
  {
    size: 200,
    top: '60%',
    left: '75%',
    animation: 'loginFloat2 22s ease-in-out infinite',
    opacity: 0.1,
    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
  },
  {
    size: 150,
    top: '20%',
    left: '80%',
    animation: 'loginFloat3 15s ease-in-out infinite',
    opacity: 0.08,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  },
  {
    size: 100,
    top: '75%',
    left: '10%',
    animation: 'loginFloat2 20s ease-in-out infinite reverse',
    opacity: 0.1,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
  },
  {
    size: 80,
    top: '10%',
    left: '50%',
    animation: 'loginFloat1 25s ease-in-out infinite reverse',
    opacity: 0.07,
    borderRadius: '40% 60% 55% 45% / 55% 40% 60% 45%',
    background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
  },
];

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      navigate('/admin');
    } catch {
      message.error(t('auth.invalidCredentials'));
    }
  };

  const fillDemo = () => {
    form.setFieldsValue({
      email: 'admin@clinic.com',
      password: 'admin123',
    });
  };

  const currentLang = i18n.language?.startsWith('tj')
    ? 'tj'
    : i18n.language?.startsWith('en')
      ? 'en'
      : 'ru';

  const toggleLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(-45deg, #3b82f6, #4f46e5, #6366f1, #8b5cf6, #3b82f6)',
          backgroundSize: '400% 400%',
          animation: 'loginGradientShift 12s ease infinite',
        }}
      >
        {/* Floating decorative shapes */}
        {floatingShapes.map((shape, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: shape.size,
              height: shape.size,
              top: shape.top,
              left: shape.left,
              borderRadius: shape.borderRadius,
              background: shape.background,
              opacity: shape.opacity,
              animation: shape.animation,
              pointerEvents: 'none',
              willChange: 'transform',
            }}
          />
        ))}

        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        {/* Login Card */}
        <div
          style={{
            width: 420,
            maxWidth: 'calc(100vw - 32px)',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow:
              '0 32px 64px -16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset',
            padding: '40px 36px 32px',
            position: 'relative',
            zIndex: 1,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.94)',
            transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Logo area */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                animation: 'loginPulse 3s ease-in-out infinite',
              }}
            >
              <MedicineBoxOutlined
                style={{
                  fontSize: 30,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              />
            </div>
            <Title
              level={3}
              style={{
                margin: '0 0 4px',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {t('app.title')}
            </Title>
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 14,
                fontWeight: 400,
              }}
            >
              {t('app.subtitle')}
            </Text>
          </div>

          {/* Form */}
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            size="large"
            layout="vertical"
            style={{ marginBottom: 8 }}
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: t('common.required') }]}
              style={{ marginBottom: 20 }}
            >
              <Input
                prefix={
                  <UserOutlined style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }} />
                }
                placeholder={t('auth.email')}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  color: '#fff',
                  height: 48,
                  fontSize: 15,
                }}
                styles={{
                  input: {
                    background: 'transparent',
                    color: '#fff',
                  },
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: t('common.required') }]}
              style={{ marginBottom: 28 }}
            >
              <Input.Password
                prefix={
                  <LockOutlined style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }} />
                }
                placeholder={t('auth.password')}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  color: '#fff',
                  height: 48,
                  fontSize: 15,
                }}
                styles={{
                  input: {
                    background: 'transparent',
                    color: '#fff',
                  },
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                style={{
                  height: 48,
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
                  backgroundSize: '200% 200%',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.3s ease',
                }}
              >
                {t('auth.login')}
              </Button>
            </Form.Item>
          </Form>

          {/* Demo button */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={fillDemo}
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.06)',
                height: 36,
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
            >
              {t('auth.demoLogin')}
            </Button>
          </div>

          {/* Language switcher */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GlobalOutlined
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginRight: 8 }}
            />
            {(['ru', 'tj', 'en'] as const).map((lng) => (
              <button
                key={lng}
                onClick={() => toggleLang(lng)}
                style={{
                  background:
                    currentLang === lng
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'transparent',
                  border: '1px solid',
                  borderColor:
                    currentLang === lng
                      ? 'rgba(255, 255, 255, 0.3)'
                      : 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  color:
                    currentLang === lng
                      ? '#fff'
                      : 'rgba(255, 255, 255, 0.5)',
                  padding: '4px 14px',
                  fontSize: 13,
                  fontWeight: currentLang === lng ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  fontFamily: 'inherit',
                }}
              >
                {lng === 'ru' ? 'RU' : lng === 'tj' ? 'TJ' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

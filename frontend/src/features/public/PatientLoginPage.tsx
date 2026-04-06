import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

const PatientLoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      const { user } = useAuthStore.getState();
      if (user?.role === 'patient') {
        navigate('/admin/patient-portal');
      } else {
        navigate('/admin');
      }
    } catch {
      message.error(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50, #eff6ff) 100%)',
      }}
    >
      <div
        className="patient-login-card"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          padding: '40px 36px 32px',
          border: '1px solid var(--gray-100)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500, #8b5cf6))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
            }}
          >
            <MedicineBoxOutlined style={{ fontSize: 26, color: 'white' }} />
          </div>
          <Title
            level={3}
            style={{
              margin: '0 0 4px',
              fontWeight: 700,
              color: 'var(--gray-900)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('public.patientLogin')}
          </Title>
          <Text style={{ color: 'var(--gray-500)', fontSize: 14 }}>
            {t('public.patientLoginSubtitle')}
          </Text>
        </div>

        {/* Form */}
        <Form
          form={form}
          name="patient-login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Email</span>}
            rules={[
              { required: true, message: t('common.required') },
              { type: 'email', message: t('public.invalidEmail') },
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder="email@example.com"
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{t('auth.password')}</span>}
            rules={[{ required: true, message: t('common.required') }]}
            style={{ marginBottom: 28 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder={t('public.enterPassword')}
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                border: 'none',
                fontSize: 15,
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
              }}
            >
              {t('auth.login')}
            </Button>
          </Form.Item>
        </Form>

        {/* Links */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Text style={{ color: 'var(--gray-500)', fontSize: 14 }}>
            {t('public.noAccount')}{' '}
            <Link
              to="/register"
              style={{ color: 'var(--primary-600)', fontWeight: 600 }}
            >
              {t('public.register')}
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              color: 'var(--gray-400)',
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            {t('public.staffLogin')}
          </Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 480px) {
          .patient-login-card {
            padding: 24px 16px 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientLoginPage;

import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicService } from '../../api/services/public.service';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const PatientRegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { fetchProfile } = useAuthStore();

  const onFinish = async (values: RegisterFormValues) => {
    if (values.password !== values.confirmPassword) {
      message.error(t('public.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword: _, ...data } = values;
      void _;
      const result = await publicService.registerPatient(data);

      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
      }
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }

      await fetchProfile();
      message.success(t('public.registrationSuccess'));
      navigate('/admin/patient-portal');
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('public.registrationError');
      message.error(msg);
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
        className="patient-register-card"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          padding: '40px 36px 32px',
          border: '1px solid var(--gray-100)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
            {t('public.registerTitle')}
          </Title>
          <Text style={{ color: 'var(--gray-500)', fontSize: 14 }}>
            {t('public.registerSubtitle')}
          </Text>
        </div>

        {/* Form */}
        <Form
          form={form}
          name="patient-register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Form.Item
              name="lastName"
              label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{t('public.lastName')}</span>}
              rules={[{ required: true, message: t('common.required') }]}
              style={{ flex: 1, minWidth: 180, marginBottom: 16 }}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'var(--gray-400)' }} />}
                placeholder={t('public.lastNamePlaceholder')}
                style={{ borderRadius: 10, height: 44 }}
              />
            </Form.Item>

            <Form.Item
              name="firstName"
              label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{t('public.firstName')}</span>}
              rules={[{ required: true, message: t('common.required') }]}
              style={{ flex: 1, minWidth: 180, marginBottom: 16 }}
            >
              <Input
                placeholder={t('public.firstNamePlaceholder')}
                style={{ borderRadius: 10, height: 44 }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="middleName"
            label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{t('public.middleName')}</span>}
            style={{ marginBottom: 16 }}
          >
            <Input
              placeholder={t('public.middleNamePlaceholder')}
              style={{ borderRadius: 10, height: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{t('public.phone')}</span>}
            rules={[{ required: true, message: t('common.required') }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder="+992 90 123 4567"
              style={{ borderRadius: 10, height: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Email</span>}
            rules={[
              { required: true, message: t('common.required') },
              { type: 'email', message: t('public.invalidEmail') },
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder="email@example.com"
              style={{ borderRadius: 10, height: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{t('auth.password')}</span>}
            rules={[
              { required: true, message: t('common.required') },
              { min: 6, message: t('public.passwordMinLength') },
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder={t('public.passwordMinLength')}
              style={{ borderRadius: 10, height: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{t('public.confirmPassword')}</span>}
            dependencies={['password']}
            rules={[
              { required: true, message: t('common.required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('public.passwordMismatch')));
                },
              }),
            ]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder={t('public.confirmPasswordPlaceholder')}
              style={{ borderRadius: 10, height: 44 }}
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
              {t('public.register')}
            </Button>
          </Form.Item>
        </Form>

        {/* Link to login */}
        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: 'var(--gray-500)', fontSize: 14 }}>
            {t('public.alreadyHaveAccount')}{' '}
            <Link
              to="/patient-login"
              style={{ color: 'var(--primary-600)', fontWeight: 600 }}
            >
              {t('auth.login')}
            </Link>
          </Text>
        </div>
      </div>
      <style>{`
        @media (max-width: 480px) {
          .patient-register-card {
            padding: 24px 16px 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientRegisterPage;

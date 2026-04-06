import React, { useState } from 'react';
import { Row, Col, Typography, Form, Input, Button, message } from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  SendOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { publicService } from '../../api/services/public.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);

  const onFinish = async (values: { name: string; email: string; message: string }) => {
    setSending(true);
    try {
      await publicService.postContactMessage(values);
      message.success(t('public.contactMessageSent'));
      form.resetFields();
    } catch {
      message.error(t('public.contactMessageError'));
    } finally {
      setSending(false);
    }
  };

  const contactItems = [
    {
      icon: <EnvironmentOutlined style={{ fontSize: 22, color: 'var(--primary-500)' }} />,
      label: t('public.addressLabel'),
      value: t('public.addressValue'),
    },
    {
      icon: <PhoneOutlined style={{ fontSize: 22, color: 'var(--primary-500)' }} />,
      label: t('public.phone'),
      value: '+992 44 600 1234',
    },
    {
      icon: <MailOutlined style={{ fontSize: 22, color: 'var(--primary-500)' }} />,
      label: t('public.emailLabel'),
      value: 'info@medclinic.tj',
    },
  ];

  const dayOffText = t('public.dayOff');
  const workingHours = [
    { day: t('common.monFri'), hours: '08:00 - 18:00' },
    { day: t('common.sat'), hours: '09:00 - 14:00' },
    { day: t('common.sun'), hours: dayOffText },
  ];

  return (
    <div>
      {/* Hero mini */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500, #8b5cf6))',
          padding: '48px 32px',
          textAlign: 'center',
          color: 'white',
          borderRadius: '0 0 24px 24px',
        }}
      >
        <Title
          level={2}
          style={{
            color: 'white',
            margin: '0 0 8px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          {t('public.contact')}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
          {t('public.contactSubtitle')}
        </Text>
      </div>

      {/* Main content */}
      <div className="public-section">
        <Row gutter={[48, 40]}>
          {/* Left column: Contact info */}
          <Col xs={24} md={12}>
            <Title
              level={3}
              style={{
                fontWeight: 700,
                color: 'var(--gray-800)',
                marginBottom: 28,
              }}
            >
              {t('public.contactInfo')}
            </Title>

            {/* Contact items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
              {contactItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'var(--primary-50, #eff6ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <Text
                      style={{
                        fontSize: 12,
                        color: 'var(--gray-400)',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {item.label}
                    </Text>
                    <Paragraph
                      style={{
                        margin: '2px 0 0',
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--gray-800)',
                      }}
                    >
                      {item.value}
                    </Paragraph>
                  </div>
                </div>
              ))}
            </div>

            {/* Working hours */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <ClockCircleOutlined
                  style={{ fontSize: 18, color: 'var(--primary-500)' }}
                />
                <Title
                  level={4}
                  style={{ margin: 0, fontWeight: 700, color: 'var(--gray-800)' }}
                >
                  {t('public.workingHours')}
                </Title>
              </div>

              <div
                style={{
                  background: 'var(--gray-50)',
                  borderRadius: 14,
                  padding: '4px 0',
                  border: '1px solid var(--gray-100)',
                  overflow: 'hidden',
                }}
              >
                {workingHours.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom:
                        idx < workingHours.length - 1
                          ? '1px solid var(--gray-100)'
                          : 'none',
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: 600,
                        color: 'var(--gray-700)',
                        fontSize: 14,
                      }}
                    >
                      {item.day}
                    </Text>
                    <Text
                      style={{
                        color:
                          item.hours === dayOffText
                            ? '#ef4444'
                            : 'var(--primary-600)',
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {item.hours}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Col>

          {/* Right column: Map placeholder */}
          <Col xs={24} md={12}>
            <Title
              level={3}
              style={{
                fontWeight: 700,
                color: 'var(--gray-800)',
                marginBottom: 28,
              }}
            >
              {t('public.onTheMap')}
            </Title>

            <div
              style={{
                width: '100%',
                height: 320,
                borderRadius: 16,
                background: 'linear-gradient(135deg, var(--gray-100), var(--gray-200, #e5e7eb))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                border: '1px solid var(--gray-200, #e5e7eb)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative grid */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, var(--gray-300, #d1d5db) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                  opacity: 0.4,
                }}
              />
              <PushpinOutlined
                style={{
                  fontSize: 40,
                  color: 'var(--primary-500)',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              <Text
                style={{
                  color: 'var(--gray-500)',
                  fontSize: 15,
                  fontWeight: 600,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {t('public.addressValue')}
              </Text>
              <Text
                style={{
                  color: 'var(--gray-400)',
                  fontSize: 13,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {t('public.map')}
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Contact form */}
      <div
        style={{
          background: 'var(--gray-50)',
          padding: '64px 32px',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Title
              level={3}
              style={{
                fontWeight: 800,
                color: 'var(--gray-800)',
                marginBottom: 8,
              }}
            >
              {t('public.writeToUs')}
            </Title>
            <Text style={{ color: 'var(--gray-500)', fontSize: 15 }}>
              {t('public.writeToUsSubtitle')}
            </Text>
          </div>

          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '32px 28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid var(--gray-100)',
            }}
          >
            <Form
              form={form}
              name="contact"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              requiredMark={false}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label={
                      <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>
                        {t('public.firstName')}
                      </span>
                    }
                    rules={[{ required: true, message: t('common.required') }]}
                  >
                    <Input
                      placeholder={t('public.yourName')}
                      style={{ borderRadius: 10, height: 44 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label={
                      <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>
                        Email
                      </span>
                    }
                    rules={[
                      { required: true, message: t('common.required') },
                      { type: 'email', message: t('public.invalidEmail') },
                    ]}
                  >
                    <Input
                      placeholder="email@example.com"
                      style={{ borderRadius: 10, height: 44 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="message"
                label={
                  <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>
                    {t('public.messageLabel')}
                  </span>
                }
                rules={[{ required: true, message: t('common.required') }]}
              >
                <TextArea
                  rows={5}
                  placeholder={t('public.messagePlaceholder')}
                  style={{ borderRadius: 10, resize: 'none' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={sending}
                  icon={<SendOutlined />}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    paddingInline: 40,
                    background:
                      'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {t('public.sendMessage')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, Tag, Tabs, Space, message } from 'antd';
import { PlusOutlined, NotificationOutlined, GiftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingService } from '../../api/services/marketing.service';
import { useTranslation } from 'react-i18next';
import type { Campaign, Promotion } from '../../types';
import { formatCurrency } from '../../utils/format';

const statusColors: Record<string, string> = {
  draft: 'default', active: 'green', completed: 'blue', cancelled: 'red',
};

const MarketingPage: React.FC = () => {
  const { t } = useTranslation();
  const [campaignModal, setCampaignModal] = useState(false);
  const [promoModal, setPromoModal] = useState(false);
  const [campForm] = Form.useForm();
  const [promoForm] = Form.useForm();
  const qc = useQueryClient();

  const statusLabels: Record<string, string> = {
    draft: t('marketing.statusDraft'), active: t('marketing.statusActive'),
    completed: t('marketing.statusCompleted'), cancelled: t('marketing.statusCancelled'),
  };

  const { data: campaigns, isLoading: campLoading } = useQuery({ queryKey: ['campaigns'], queryFn: () => marketingService.findAllCampaigns() });
  const { data: promotions, isLoading: promoLoading } = useQuery({ queryKey: ['promotions'], queryFn: () => marketingService.findAllPromotions() });

  const createCamp = useMutation({ mutationFn: (d: Partial<Campaign>) => marketingService.createCampaign(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); message.success(t('marketing.campaignCreated')); } });
  const createPromo = useMutation({ mutationFn: (d: Partial<Promotion>) => marketingService.createPromotion(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); message.success(t('marketing.promoCreated')); } });

  const campaignColumns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: t('marketing.channel'), dataIndex: 'channel', key: 'channel', width: 100, render: (v: string) => <Tag>{v?.toUpperCase()}</Tag> },
    { title: t('marketing.recipients'), dataIndex: 'recipientsCount', key: 'recipientsCount', width: 110 },
    { title: t('marketing.delivered'), dataIndex: 'deliveredCount', key: 'deliveredCount', width: 110 },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 120, render: (s: string) => { const label = statusLabels[s] || s; const color = statusColors[s] || 'default'; return <Tag color={color}>{label}</Tag>; } },
  ];

  const promoColumns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: t('marketing.promoCode'), dataIndex: 'promoCode', key: 'promoCode', width: 130, render: (v: string) => v ? <Tag color="blue" style={{ fontFamily: 'monospace' }}>{v}</Tag> : '—' },
    { title: t('marketing.discount'), key: 'discount', width: 100, render: (_: unknown, r: Promotion) => r.discountPercent ? `${r.discountPercent}%` : r.discountAmount ? formatCurrency(r.discountAmount) : '—' },
    { title: t('marketing.period'), key: 'period', render: (_: unknown, r: Promotion) => `${new Date(r.startDate).toLocaleDateString('ru-RU')} — ${new Date(r.endDate).toLocaleDateString('ru-RU')}` },
    { title: t('marketing.uses'), key: 'uses', width: 130, render: (_: unknown, r: Promotion) => `${r.currentUses}${r.maxUses ? ` / ${r.maxUses}` : ''}` },
    { title: t('common.status'), dataIndex: 'isActive', key: 'isActive', width: 100, render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('marketing.active') : t('marketing.inactive')}</Tag> },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><NotificationOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.marketing')}</h2>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Tabs items={[
            {
              key: 'campaigns', label: t('marketing.campaigns'),
              children: (<>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCampaignModal(true)}>{t('marketing.newCampaign')}</Button>
                </div>
                <Table columns={campaignColumns} dataSource={(campaigns as { data: Campaign[] })?.data || []} rowKey="id" loading={campLoading} pagination={false} size="middle" scroll={{ x: 700 }} />
              </>),
            },
            {
              key: 'promotions', label: t('marketing.promotionsTab'),
              children: (<>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setPromoModal(true)}>{t('marketing.newPromo')}</Button>
                </div>
                <Table columns={promoColumns} dataSource={(promotions as { data: Promotion[] })?.data || []} rowKey="id" loading={promoLoading} pagination={false} size="middle" scroll={{ x: 750 }} />
              </>),
            },
          ]} />
        </div>
      </div>

      <Modal title={t('marketing.newCampaign')} open={campaignModal} onCancel={() => setCampaignModal(false)} onOk={() => campForm.submit()} okText={t('common.create')} cancelText={t('common.cancel')} width={520}>
        <Form form={campForm} layout="vertical" onFinish={async (v) => { await createCamp.mutateAsync(v); setCampaignModal(false); campForm.resetFields(); }}>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="channel" label={t('marketing.channel')} rules={[{ required: true }]}>
              <Select options={[{ value: 'sms', label: 'SMS' }, { value: 'email', label: 'Email' }, { value: 'telegram', label: 'Telegram' }]} />
            </Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="scheduledAt" label={t('marketing.sendDate')}><DatePicker style={{ width: '100%' }} showTime /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label={t('marketing.description')}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={t('marketing.newPromo')} open={promoModal} onCancel={() => setPromoModal(false)} onOk={() => promoForm.submit()} okText={t('common.create')} cancelText={t('common.cancel')} width={520}>
        <Form form={promoForm} layout="vertical" onFinish={async (v) => {
          const data = { ...v, startDate: v.startDate?.format('YYYY-MM-DD'), endDate: v.endDate?.format('YYYY-MM-DD') };
          await createPromo.mutateAsync(data); setPromoModal(false); promoForm.resetFields();
        }}>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}><Form.Item name="promoCode" label={t('marketing.promoCode')}><Input /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="discountPercent" label={t('marketing.discountPercent')}><InputNumber style={{ width: '100%' }} min={0} max={100} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="maxUses" label={t('marketing.maxUses')}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="startDate" label={t('marketing.startDate')} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="endDate" label={t('marketing.endDate')} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MarketingPage;

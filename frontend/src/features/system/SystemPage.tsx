import React, { useState } from 'react';
import { Table, Tabs, Input, Select, Row, Col, Tag, Button, Modal, Form, message } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSystemSettings, useSystemLogs, useUpsertSetting, useDeleteSetting } from '../../hooks/useSystem';
import type { SystemSettings } from '../../types';

const levelColors: Record<string, string> = { info: 'blue', warning: 'orange', error: 'red', critical: 'volcano' };

const SystemPage: React.FC = () => {
  const { t } = useTranslation();
  const [settingsCategory, setSettingsCategory] = useState<string | undefined>(undefined);
  const [logLevel, setLogLevel] = useState<string | undefined>(undefined);
  const [logPage, setLogPage] = useState(1);
  const [isSettingModal, setIsSettingModal] = useState(false);
  const [form] = Form.useForm();

  const { data: settings, isLoading: settingsLoading } = useSystemSettings(settingsCategory);
  const { data: logsData, isLoading: logsLoading } = useSystemLogs({ level: logLevel, page: logPage, limit: 50 });
  const upsertSetting = useUpsertSetting();
  const deleteSetting = useDeleteSetting();

  const logs = logsData?.data || [];
  const logsTotal = logsData?.total || 0;

  const handleSaveSetting = async (values: { key: string; value: string; category?: string; description?: string; valueType?: string }) => {
    await upsertSetting.mutateAsync(values);
    message.success(t('system.settingSaved'));
    setIsSettingModal(false);
    form.resetFields();
  };

  const settingsColumns = [
    { title: t('system.key'), dataIndex: 'key', key: 'key', render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span> },
    { title: t('system.value'), dataIndex: 'value', key: 'value', render: (v: string) => <span style={{ maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span> },
    { title: t('system.category'), dataIndex: 'category', key: 'category', width: 130, render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
    { title: t('system.type'), dataIndex: 'valueType', key: 'valueType', width: 90 },
    { title: t('system.description'), dataIndex: 'description', key: 'description', render: (v: string) => <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{v || '—'}</span> },
    { title: '', key: 'actions', width: 80, render: (_: unknown, r: SystemSettings) => (
      <Button type="text" size="small" danger onClick={async () => { await deleteSetting.mutateAsync(r.key); message.success(t('system.deleted')); }}>{t('common.delete')}</Button>
    )},
  ];

  const logColumns = [
    { title: t('system.time'), dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: string) => new Date(d).toLocaleString('ru-RU') },
    { title: t('system.level'), dataIndex: 'level', key: 'level', width: 100, render: (l: string) => <Tag color={levelColors[l] || 'default'}>{l.toUpperCase()}</Tag> },
    { title: t('system.source'), dataIndex: 'source', key: 'source', width: 140 },
    { title: t('system.message'), dataIndex: 'message', key: 'message' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><SettingOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('system.title')}</h2>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Tabs items={[
            {
              key: 'settings', label: t('nav.settings'),
              children: (<>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Select placeholder={t('system.category')} allowClear style={{ minWidth: 140 }} value={settingsCategory} onChange={setSettingsCategory}
                    options={[{ value: 'security', label: t('system.categorySecurity') }, { value: 'regional', label: t('system.categoryRegional') }, { value: 'storage', label: t('system.categoryStorage') }]} />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsSettingModal(true)}>{t('system.add')}</Button>
                </div>
                <Table columns={settingsColumns} dataSource={settings || []} rowKey="id" loading={settingsLoading} pagination={false} size="small" scroll={{ x: 800 }} />
              </>),
            },
            {
              key: 'logs', label: t('system.systemLogs'),
              children: (<>
                <Select placeholder={t('system.level')} allowClear style={{ minWidth: 140, marginBottom: 16 }} value={logLevel} onChange={(v) => { setLogLevel(v); setLogPage(1); }}
                  options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' }, { value: 'critical', label: 'Critical' }]} />
                <Table columns={logColumns} dataSource={logs} rowKey="id" loading={logsLoading}
                  pagination={{ current: logPage, pageSize: 50, total: logsTotal, onChange: (p) => setLogPage(p) }} size="small" scroll={{ x: 700 }} />
              </>),
            },
          ]} />
        </div>
      </div>

      <Modal title={t('system.newSetting')} open={isSettingModal} onCancel={() => setIsSettingModal(false)} onOk={() => form.submit()}
        confirmLoading={upsertSetting.isPending} okText={t('common.save')} cancelText={t('common.cancel')} width={480}>
        <Form form={form} layout="vertical" onFinish={handleSaveSetting}>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="key" label={t('system.key')} rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="valueType" label={t('system.type')} initialValue="string">
              <Select options={[{ value: 'string' }, { value: 'number' }, { value: 'boolean' }, { value: 'json' }]} />
            </Form.Item></Col>
          </Row>
          <Form.Item name="value" label={t('system.value')} rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="category" label={t('system.category')}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="description" label={t('system.description')}><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemPage;

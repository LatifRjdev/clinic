import React, { useState } from 'react';
import { Table, Button, Tag, Select, Modal, Form, Input, Space, Empty, message, Upload } from 'antd';
import { FolderOutlined, PlusOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '../../api/services/documents.service';
import type { Document as DocType } from '../../api/services/documents.service';
import { storageService } from '../../api/services/storage.service';
import { useTranslation } from 'react-i18next';

const typeColors: Record<string, string> = {
  contract: 'blue', consent: 'green', discharge: 'purple', certificate: 'cyan',
  prescription: 'orange', referral: 'magenta', other: 'default',
};

const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [isModal, setIsModal] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const typeLabels: Record<string, string> = {
    contract: t('documents.typeContract'), consent: t('documents.typeConsent'),
    discharge: t('documents.typeDischarge'), certificate: t('documents.typeCertificate'),
    prescription: t('documents.typePrescription'), referral: t('documents.typeReferral'),
    other: t('documents.typeOther'),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { type: typeFilter, page }],
    queryFn: () => documentsService.findAll({ type: typeFilter, page, limit: 30 }),
  });

  const createDoc = useMutation({
    mutationFn: (d: Partial<DocType>) => documentsService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); message.success(t('documents.created')); },
  });

  const deleteDoc = useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); message.success(t('documents.deleted')); },
  });

  const documents = data?.data || [];
  const total = data?.total || 0;

  const typeOptions = Object.entries(typeLabels).map(([k, label]) => ({ value: k, label }));

  const columns = [
    {
      title: t('common.name'), dataIndex: 'title', key: 'title',
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: t('documents.type'), dataIndex: 'type', key: 'type', width: 130,
      render: (tp: string) => { const label = typeLabels[tp] || tp; const color = typeColors[tp] || 'default'; return <Tag color={color}>{label}</Tag>; },
    },
    {
      title: t('documents.size'), dataIndex: 'fileSize', key: 'fileSize', width: 100,
      render: (s: number) => s ? `${(s / 1024).toFixed(0)} KB` : '—',
    },
    {
      title: t('common.date'), dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (d: string) => new Date(d).toLocaleString('ru-RU'),
    },
    {
      title: t('documents.signed'), key: 'signed', width: 100,
      render: (_: unknown, r: DocType) => r.signedAt ? <Tag color="green">{t('common.yes')}</Tag> : <Tag color="default">{t('common.no')}</Tag>,
    },
    {
      title: '', key: 'actions', width: 160,
      render: (_: unknown, r: DocType) => (
        <Space>
          <Button type="text" size="small" icon={<DownloadOutlined />}
            onClick={async () => { const res = await documentsService.download(r.id); window.open(res.fileUrl, '_blank'); }}>
            {t('documents.download')}
          </Button>
          <Button type="text" size="small" danger onClick={() => deleteDoc.mutate(r.id)}>{t('common.delete')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><FolderOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.documents')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModal(true)}>{t('common.create')}</Button>
      </div>
      <div className="modern-card">
        <div className="modern-card-body">
          <Select placeholder={t('documents.documentType')} allowClear style={{ minWidth: 140, marginBottom: 16 }}
            value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }}
            options={typeOptions} />
          <Table columns={columns} dataSource={documents} rowKey="id" loading={isLoading}
            pagination={{ current: page, pageSize: 30, total, onChange: (p) => setPage(p) }}
            size="middle" scroll={{ x: 800 }} locale={{ emptyText: <Empty description={t('documents.noDocuments')} /> }} />
        </div>
      </div>

      <Modal title={t('documents.newDocument')} open={isModal} onCancel={() => setIsModal(false)} onOk={() => form.submit()}
        confirmLoading={createDoc.isPending} okText={t('common.create')} cancelText={t('common.cancel')} width={500}>
        <Form form={form} layout="vertical" onFinish={async (v) => {
          let fileUrl = v.fileUrl || '';
          if (v.file?.file?.originFileObj) {
            const uploaded = await storageService.upload(v.file.file.originFileObj, 'documents');
            fileUrl = uploaded.key;
          }
          await createDoc.mutateAsync({ ...v, fileUrl, file: undefined });
          setIsModal(false); form.resetFields();
        }}>
          <Form.Item name="title" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label={t('documents.type')} rules={[{ required: true }]}>
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item name="file" label={t('documents.file')}>
            <Upload maxCount={1} beforeUpload={() => false}><Button icon={<UploadOutlined />}>{t('documents.selectFile')}</Button></Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentsPage;

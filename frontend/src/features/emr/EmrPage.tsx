import React, { useState, useEffect, useRef } from 'react';
import {
  Table, Button, Space, Select, DatePicker, Row, Col, Avatar, Tag, Alert, Drawer, Card,
  Tooltip, Modal, Form, Input, InputNumber, message, Checkbox, Tabs, AutoComplete, Divider, List,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, PrinterOutlined, FileTextOutlined,
  EditOutlined, CheckOutlined, DollarOutlined, SafetyCertificateOutlined,
  HeartOutlined, DeleteOutlined, MedicineBoxOutlined, SendOutlined,
  UploadOutlined, PaperClipOutlined, DownloadOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMedicalRecords, useCreateMedicalRecord, useSignMedicalRecord, useVitalSigns, useCreateVitalSigns, usePrescriptions, useCreatePrescription, useDeletePrescription, useReferrals, useCreateReferral, useChangeReferralStatus, useTemplates } from '../../hooks/useEmr';
import { usePatientSearch } from '../../hooks/usePatients';
import { useAuthStore } from '../../store/authStore';
import SignatureCanvas from '../../components/SignatureCanvas';
import { icd10Codes } from '../../data/icd10-common';
import { attachmentsService } from '../../api/services/emr.service';
import apiClient from '../../api/client';
import type { MedicalRecord, Prescription, Referral, VitalSigns, Patient, EmrTemplate } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusClassMapEmr: Record<string, string> = {
  signed: 'confirmed',
  draft: 'in-progress',
  amended: 'scheduled',
};

interface PrintOptions {
  record: MedicalRecord;
  t: (key: string) => string;
  prescriptions?: Prescription[];
}

const printMedicalRecord = ({ record, t, prescriptions }: PrintOptions) => {
  const p = (record as Record<string, unknown>).patient as {
    firstName?: string; lastName?: string; dateOfBirth?: string; phone?: string;
  } | undefined;
  const d = (record as Record<string, unknown>).doctor as { firstName?: string; lastName?: string } | undefined;
  const patientName = p ? `${p.lastName || ''} ${p.firstName || ''}`.trim() : record.patientId;
  const patientDob = p?.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('ru-RU') : '';
  const patientPhone = p?.phone || '';
  const doctorName = d ? `${d.lastName || ''} ${d.firstName || ''}`.trim() : record.doctorId;
  const date = new Date(record.createdAt).toLocaleDateString('ru-RU');

  const prescriptionsHtml = prescriptions && prescriptions.length > 0
    ? `<div class="field" style="margin-top:20px">
        <div class="field-label">${t('emr.prescriptionsTitle')}</div>
        <table class="rx-table">
          <thead><tr>
            <th>${t('emr.medicationName')}</th>
            <th>${t('emr.dosage')}</th>
            <th>${t('emr.frequency')}</th>
            <th>${t('emr.durationLabel')}</th>
          </tr></thead>
          <tbody>
            ${prescriptions.map((rx) => `<tr>
              <td>${(rx as Record<string, unknown>).medication || ''}</td>
              <td>${(rx as Record<string, unknown>).dosage || ''}</td>
              <td>${(rx as Record<string, unknown>).frequency || ''}</td>
              <td>${(rx as Record<string, unknown>).duration || ''}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('emr.printTitle')}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
      .clinic-header { text-align: center; margin-bottom: 8px; }
      .clinic-name { font-size: 20px; font-weight: bold; color: #1a56db; margin-bottom: 4px; }
      .clinic-info { font-size: 12px; color: #666; }
      hr.header-line { border: none; border-top: 2px solid #1a56db; margin: 16px 0 24px 0; }
      h1 { font-size: 18px; text-align: center; margin-bottom: 24px; }
      .patient-info { background: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
      .patient-info span { margin-right: 24px; }
      .field { margin-bottom: 16px; }
      .field-label { font-weight: bold; margin-bottom: 4px; color: #555; font-size: 13px; text-transform: uppercase; }
      .field-value { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
      .diagnosis { background: #f5f5f5; padding: 12px; border-radius: 4px; font-weight: bold; font-size: 14px; }
      .rx-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
      .rx-table th, .rx-table td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
      .rx-table th { background: #f5f5f5; font-weight: 600; }
      .signature-line { margin-top: 40px; display: flex; justify-content: space-between; font-size: 14px; }
      .signature-line span { border-top: 1px solid #333; padding-top: 4px; min-width: 200px; text-align: center; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
      @media print {
        body { padding: 20px; }
        .clinic-name { color: #1a56db !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        hr.header-line { border-top-color: #1a56db !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .patient-info { background: #f8f9fa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .diagnosis { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .rx-table th { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style></head><body>
    <div class="clinic-header">
      <div class="clinic-name">${t('emr.clinicName')}</div>
      <div class="clinic-info">${'\u0433. \u0414\u0443\u0448\u0430\u043d\u0431\u0435, \u0443\u043b. \u0421\u043e\u043c\u043e\u043d\u0438 42'} &bull; +992 44 600 1234</div>
    </div>
    <hr class="header-line" />
    <h1>${t('emr.printTitle')}</h1>
    <div class="patient-info">
      <span><b>${t('emr.printPatient')}:</b> ${patientName}</span>
      ${patientDob ? `<span><b>${t('emr.patientDob')}:</b> ${patientDob}</span>` : ''}
      ${patientPhone ? `<span><b>${t('emr.patientPhone')}:</b> ${patientPhone}</span>` : ''}
    </div>
    <div class="field"><div class="field-label">${t('emr.complaints')}</div><div class="field-value">${record.complaints || '\u2014'}</div></div>
    <div class="field"><div class="field-label">${t('emr.anamnesis')}</div><div class="field-value">${record.anamnesis || '\u2014'}</div></div>
    <div class="field"><div class="field-label">${t('emr.examination')}</div><div class="field-value">${record.examination || '\u2014'}</div></div>
    <div class="field"><div class="field-label">${t('emr.diagnosis')}</div><div class="diagnosis">${record.diagnosis}${record.diagnosisCode ? ` (${record.diagnosisCode})` : ''}</div></div>
    <div class="field"><div class="field-label">${t('emr.recommendations')}</div><div class="field-value">${record.recommendations || '\u2014'}</div></div>
    ${prescriptionsHtml}
    <div class="signature-line">
      <div>${t('emr.doctorSignature')}: _______________ / ${doctorName}</div>
      <div>${t('emr.printDate')}: ${date}</div>
    </div>
    <div class="footer">${t('emr.confidential')} &copy; 2026</div>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
};

const EmrPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [recordToSign, setRecordToSign] = useState<MedicalRecord | null>(null);
  const [signConfirmed, setSignConfirmed] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [vitalsFormOpen, setVitalsFormOpen] = useState(false);
  const [vitalsForm] = Form.useForm();
  const [prescriptionFormOpen, setPrescriptionFormOpen] = useState(false);
  const [prescriptionForm] = Form.useForm();
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralForm] = Form.useForm();
  const [form] = Form.useForm();

  // Template drawer state
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);

  // File attachments state (view modal)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; date: string; url?: string }[]>([]);

  // Patient context state (create modal)
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);

  const { data: recordsData, isLoading } = useMedicalRecords({
    page,
    limit: 20,
    dateFrom: dateRange?.[0],
    dateTo: dateRange?.[1],
  });
  const createRecord = useCreateMedicalRecord();
  const signRecordMutation = useSignMedicalRecord();
  const { data: searchedPatients } = usePatientSearch(patientSearch);
  const { data: patientVitals, isLoading: vitalsLoading } = useVitalSigns(viewRecord?.patientId || '');
  const createVitalSigns = useCreateVitalSigns();
  const { data: prescriptionsData } = usePrescriptions({ medicalRecordId: viewRecord?.id });
  const createPrescription = useCreatePrescription();
  const deletePrescription = useDeletePrescription();
  const { data: referralsData } = useReferrals({ patientId: viewRecord?.patientId });
  const createReferral = useCreateReferral();
  const changeReferralStatus = useChangeReferralStatus();

  // Templates
  const { data: templatesData } = useTemplates();
  const templates: EmrTemplate[] = (templatesData as { data?: EmrTemplate[] })?.data || (Array.isArray(templatesData) ? templatesData as EmrTemplate[] : []);

  // Patient records for "last diagnosis" context
  const { data: patientRecordsData } = useMedicalRecords({
    patientId: selectedPatientData?.id,
    limit: 1,
  });
  const lastPatientRecord = (patientRecordsData?.data || [])[0] || null;

  const prescriptions = prescriptionsData?.data || [];
  const referrals = referralsData?.data || [];

  const handleCreatePrescription = async (values: Record<string, unknown>) => {
    if (!viewRecord) return;
    try {
      await createPrescription.mutateAsync({
        ...values,
        patientId: viewRecord.patientId,
        doctorId: viewRecord.doctorId,
        medicalRecordId: viewRecord.id,
        isActive: true,
      } as Partial<Prescription>);
      message.success(t('emr.prescriptionCreated'));
      prescriptionForm.resetFields();
      setPrescriptionFormOpen(false);
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleCreateReferral = async (values: Record<string, unknown>) => {
    if (!viewRecord) return;
    try {
      await createReferral.mutateAsync({
        ...values,
        patientId: viewRecord.patientId,
        referringDoctorId: viewRecord.doctorId,
      } as Partial<Referral>);
      message.success(t('emr.referralCreated'));
      referralForm.resetFields();
      setReferralModalOpen(false);
    } catch {
      message.error(t('common.error'));
    }
  };

  const printPrescription = async (prescription: Prescription) => {
    try {
      const response = await apiClient.get(`/pdf/prescription/${prescription.id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      message.error(t('common.error'));
    }
  };

  const referralStatusFlow: Record<string, string> = {
    created: 'scheduled',
    scheduled: 'completed',
  };

  const priorityColorMap: Record<string, string> = {
    routine: 'blue',
    urgent: 'orange',
    emergency: 'red',
  };

  const statusColorMap: Record<string, string> = {
    created: 'default',
    scheduled: 'processing',
    completed: 'success',
    cancelled: 'error',
  };

  // Auto-open modal if navigated from scheduling with params
  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    const patientId = searchParams.get('patientId');
    if (appointmentId || patientId) {
      form.setFieldsValue({
        patientId: patientId || undefined,
        appointmentId: appointmentId || undefined,
      });
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const records = recordsData?.data || [];
  const total = recordsData?.total || 0;

  const filteredRecords = statusFilter
    ? records.filter((r) => r.status === statusFilter)
    : records;

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        ...values,
        doctorId: user?.id,
      };
      if (!payload.appointmentId) delete payload.appointmentId;
      await createRecord.mutateAsync(payload as Partial<MedicalRecord>);
      message.success(t('emr.recordCreated'));
      setHasUnsavedChanges(false);
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error(t('common.error'));
    }
  };

  const openSignModal = (record: MedicalRecord) => {
    setRecordToSign(record);
    setSignModalOpen(true);
    setSignConfirmed(false);
    setSignatureImage(null);
    setTypedSignature('');
    setSignatureMode('draw');
  };

  const handleSignSubmit = async () => {
    if (!recordToSign) return;
    if (!signConfirmed) {
      message.warning(t('emr.confirmRequired'));
      return;
    }
    try {
      const sigImg = signatureMode === 'draw' ? signatureImage : undefined;
      await signRecordMutation.mutateAsync({ id: recordToSign.id, signatureImage: sigImg || undefined });
      message.success(t('emr.recordSigned'));
      setSignModalOpen(false);
      setRecordToSign(null);
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleSign = (record: MedicalRecord) => {
    openSignModal(record);
  };

  // Template selection handler
  const handleSelectTemplate = (template: EmrTemplate) => {
    const fieldMapping: Record<string, string> = {};
    template.fields.forEach((field) => {
      if (['complaints', 'anamnesis', 'examination', 'diagnosis', 'diagnosisCode', 'recommendations'].includes(field.name)) {
        fieldMapping[field.name] = field.label;
      }
    });
    form.setFieldsValue(fieldMapping);
    setTemplateDrawerOpen(false);
    message.success(`${t('emr.fromTemplate')}: ${template.name}`);
  };

  // File attachment upload handler
  const handleFileUpload = async (file: File) => {
    if (!viewRecord) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await attachmentsService.upload(viewRecord.id, formData);
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          date: new Date().toISOString(),
          url: result?.url || result?.fileUrl,
        },
      ]);
      message.success(t('emr.fileUploaded'));
    } catch {
      message.error(t('common.error'));
    }
  };

  // Patient context: fetch patient details on selection
  const handlePatientSelect = async (patientId: string) => {
    try {
      const resp = await apiClient.get(`/patients/${patientId}`);
      setSelectedPatientData(resp.data);
    } catch {
      setSelectedPatientData(null);
    }
  };

  // Reset patient context when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setSelectedPatientData(null);
    }
  }, [modalOpen]);

  // Reset uploaded files when view record changes
  useEffect(() => {
    setUploadedFiles([]);
  }, [viewRecord?.id]);

  const columns = [
    {
      title: t('common.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => (
        <span style={{ fontWeight: 500, color: 'var(--gray-700)', fontSize: 13 }}>
          {d ? new Date(d).toLocaleDateString('ru-RU') : ''}
        </span>
      ),
    },
    {
      title: t('scheduling.patient'),
      key: 'patient',
      render: (_: unknown, record: MedicalRecord) => {
        const p = (record as Record<string, unknown>).patient as { firstName?: string; lastName?: string } | undefined;
        const name = p ? `${p.lastName || ''} ${p.firstName || ''}`.trim() : record.patientId?.slice(0, 8) + '...';
        return (
          <Space>
            <Avatar size={30} style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', fontSize: 13 }}>
              {name.charAt(0)}
            </Avatar>
            <span style={{ fontWeight: 500 }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: t('emr.diagnosis'),
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      render: (diag: string, record: MedicalRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{diag}</span>
          {record.diagnosisCode && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 99, background: 'var(--gray-100)', color: 'var(--gray-500)',
            }}>
              {record.diagnosisCode}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const labelMap: Record<string, string> = {
          signed: t('emr.signed'),
          draft: t('emr.draft'),
          amended: t('emr.amended'),
        };
        return <span className={`status-badge ${statusClassMapEmr[status] || ''}`}>{labelMap[status] || status}</span>;
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 140,
      render: (_: unknown, record: MedicalRecord) => (
        <Space>
          <Tooltip title={t('emr.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              style={{ color: 'var(--primary-500)' }}
              onClick={() => setViewRecord(record)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title={t('emr.sign')}>
              <Button
                type="text"
                icon={<CheckOutlined />}
                size="small"
                style={{ color: '#10b981' }}
                onClick={() => handleSign(record)}
              />
            </Tooltip>
          )}
          <Tooltip title={t('emr.print')}>
            <Button type="text" icon={<PrinterOutlined />} size="small" style={{ color: 'var(--gray-400)' }} onClick={() => printMedicalRecord({ record, t })} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h2>
            <FileTextOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
            {t('emr.title')}
          </h2>
          <p className="page-header-subtitle">{t('emr.totalRecords', { count: total })}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('emr.newRecord')}
        </Button>
      </div>

      {/* Filters */}
      <div className="modern-card" style={{ marginBottom: 20 }}>
        <div className="modern-card-body" style={{ padding: '16px 24px' }}>
          <Row gutter={16} align="middle">
            <Col>
              <RangePicker
                style={{ borderRadius: 'var(--radius-md)' }}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD'),
                    ]);
                    setPage(1);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
            </Col>
            <Col>
              <Select
                placeholder={t('common.status')}
                allowClear
                style={{ minWidth: 160, width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'signed', label: t('emr.signed') },
                  { value: 'draft', label: t('emr.draft') },
                  { value: 'amended', label: t('emr.amended') },
                ]}
              />
            </Col>
          </Row>
        </div>
      </div>

      {/* Table */}
      <div className="modern-card">
        <div className="modern-card-body">
          <Table
            columns={columns}
            dataSource={filteredRecords}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 800 }}
            pagination={{
              current: page,
              pageSize: 20,
              total,
              onChange: (p) => setPage(p),
            }}
            size="middle"
          />
        </div>
      </div>

      {/* Create Record Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{t('emr.newRecord')}</span>
            <Button
              type="default"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => setTemplateDrawerOpen(true)}
              style={{ marginRight: 24 }}
            >
              {t('emr.fromTemplate')}
            </Button>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          if (hasUnsavedChanges) {
            Modal.confirm({
              title: t('emr.unsavedChangesTitle'),
              content: t('emr.unsavedChangesMessage'),
              okText: t('common.yes'),
              cancelText: t('common.no'),
              onOk: () => {
                setHasUnsavedChanges(false);
                setModalOpen(false);
                form.resetFields();
              },
            });
          } else {
            setModalOpen(false);
            form.resetFields();
          }
        }}
        onOk={() => form.submit()}
        confirmLoading={createRecord.isPending}
        width={700}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} onValuesChange={() => setHasUnsavedChanges(true)}>
          <Form.Item name="appointmentId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="patientId" label={t('scheduling.patient')} rules={[{ required: true, message: t('emr.patientRequired') }]}>
            <Select
              showSearch
              placeholder={t('patients.search')}
              filterOption={false}
              onSearch={(v) => setPatientSearch(v)}
              onSelect={(val: string) => handlePatientSelect(val)}
              options={(searchedPatients || []).map((p) => ({
                value: p.id,
                label: `${p.lastName} ${p.firstName} ${p.middleName || ''}`.trim(),
              }))}
              notFoundContent={patientSearch.length < 2 ? t('common.searchMinChars') : t('common.nothingFound')}
            />
          </Form.Item>
          {/* Patient context card */}
          {selectedPatientData && (
            <div style={{ marginBottom: 16 }}>
              {selectedPatientData.allergies && (
                <Alert
                  type="error"
                  showIcon
                  icon={<WarningOutlined />}
                  message={`${t('emr.patientAllergies')}: ${selectedPatientData.allergies}`}
                  style={{ marginBottom: 8 }}
                />
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {selectedPatientData.bloodType && (
                  <Tag color="red" style={{ fontWeight: 600, fontSize: 13 }}>
                    {selectedPatientData.bloodType}
                  </Tag>
                )}
                {!selectedPatientData.allergies && (
                  <Tag color="green">{t('emr.noAllergies')}</Tag>
                )}
                {lastPatientRecord && (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {t('emr.lastDiagnosis')}: {lastPatientRecord.diagnosis}
                    {lastPatientRecord.diagnosisCode ? ` (${lastPatientRecord.diagnosisCode})` : ''}
                  </span>
                )}
              </div>
            </div>
          )}
          <Form.Item name="complaints" label={t('emr.complaints')} rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="anamnesis" label={t('emr.anamnesis')} rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="examination" label={t('emr.examination')} rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item name="diagnosis" label={t('emr.diagnosis')} rules={[{ required: true }]}>
                <AutoComplete
                  options={icd10Codes.map((item) => ({
                    value: item.name,
                    label: (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.code}</span>
                      </div>
                    ),
                    code: item.code,
                  }))}
                  filterOption={(inputValue, option) =>
                    option?.value
                      ? String(option.value).toLowerCase().includes(inputValue.toLowerCase())
                      : false
                  }
                  onSelect={(value, option) => {
                    form.setFieldsValue({
                      diagnosis: value,
                      diagnosisCode: (option as any).code,
                    });
                  }}
                  placeholder={t('emr.diagnosis')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="diagnosisCode" label={t('emr.diagnosisCode')}>
                <AutoComplete
                  options={icd10Codes.map((item) => ({
                    value: item.code,
                    label: (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{item.code}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>
                          {item.name.length > 30 ? item.name.slice(0, 30) + '...' : item.name}
                        </span>
                      </div>
                    ),
                    diagnosisName: item.name,
                  }))}
                  filterOption={(inputValue, option) =>
                    option?.value
                      ? String(option.value).toLowerCase().includes(inputValue.toLowerCase())
                      : false
                  }
                  onSelect={(value, option) => {
                    form.setFieldsValue({
                      diagnosisCode: value,
                      diagnosis: (option as any).diagnosisName,
                    });
                  }}
                  placeholder="J06.9"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="recommendations" label={t('emr.recommendations')}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Record Modal */}
      <Modal
        title={t('emr.view')}
        open={!!viewRecord}
        onCancel={() => { setViewRecord(null); setVitalsFormOpen(false); vitalsForm.resetFields(); }}
        footer={[
          <Button key="close" onClick={() => setViewRecord(null)}>{t('common.close')}</Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={() => viewRecord && printMedicalRecord({ record: viewRecord, t, prescriptions })}>
            {t('emr.print')}
          </Button>,
          viewRecord?.status === 'signed' && (
            <Button key="invoice" icon={<DollarOutlined />}
              style={{ background: '#6366f1', color: 'white', border: 'none' }}
              onClick={() => { navigate(`/billing/invoices?patientId=${viewRecord!.patientId}`); setViewRecord(null); }}>
              {t('nav.invoices')}
            </Button>
          ),
          viewRecord?.status === 'draft' && (
            <Button key="sign" type="primary" icon={<CheckOutlined />}
              onClick={() => { handleSign(viewRecord!); setViewRecord(null); }}>
              {t('emr.sign')}
            </Button>
          ),
        ]}
        width={650}
      >
        {viewRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{t('emr.complaints').toUpperCase()}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{viewRecord.complaints}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{t('emr.anamnesis').toUpperCase()}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{viewRecord.anamnesis}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{t('emr.examination').toUpperCase()}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{viewRecord.examination}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{t('emr.diagnosis').toUpperCase()}</div>
              <div style={{ fontSize: 14, marginTop: 4, fontWeight: 600 }}>
                {viewRecord.diagnosis}
                {viewRecord.diagnosisCode && <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}> ({viewRecord.diagnosisCode})</span>}
              </div>
            </div>
            {viewRecord.recommendations && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{t('emr.recommendations').toUpperCase()}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{viewRecord.recommendations}</div>
              </div>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, marginBottom: 8 }}>
                <HeartOutlined style={{ marginRight: 6, color: '#ef4444' }} />
                {t('emr.vitalSigns').toUpperCase()}
              </div>
              {vitalsLoading ? (
                <div style={{ color: 'var(--gray-400)', fontSize: 13 }}>...</div>
              ) : patientVitals && patientVitals.length > 0 ? (
                (() => {
                  const v = patientVitals[0];
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                      {(v.systolicBp || v.diastolicBp) && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalBp')}:</span> {v.systolicBp}/{v.diastolicBp} {t('emr.vitalBpUnit')}</div>
                      )}
                      {v.heartRate != null && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalHeartRate')}:</span> {v.heartRate} {t('emr.vitalHeartRateUnit')}</div>
                      )}
                      {v.temperature != null && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalTemperature')}:</span> {v.temperature} °C</div>
                      )}
                      {v.spo2 != null && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalSpo2')}:</span> {v.spo2} %</div>
                      )}
                      {v.weight != null && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalWeight')}:</span> {v.weight} кг</div>
                      )}
                      {v.height != null && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalHeight')}:</span> {v.height} см</div>
                      )}
                      {v.glucose != null && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalGlucose')}:</span> {v.glucose} {t('emr.vitalGlucoseUnit')}</div>
                      )}
                      {v.measuredAt && (
                        <div><span style={{ color: 'var(--gray-400)' }}>{t('emr.vitalMeasuredAt')}:</span> {new Date(v.measuredAt).toLocaleString('ru-RU')}</div>
                      )}
                    </div>
                  );
                })()
              ) : !vitalsFormOpen ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 8 }}>{t('emr.vitalNoData')}</div>
                  <Button size="small" icon={<HeartOutlined />} onClick={() => setVitalsFormOpen(true)}>
                    {t('emr.vitalRecord')}
                  </Button>
                </div>
              ) : null}
              {vitalsFormOpen && (
                <Form
                  form={vitalsForm}
                  layout="vertical"
                  size="small"
                  style={{ marginTop: 8 }}
                  onFinish={async (values) => {
                    try {
                      await createVitalSigns.mutateAsync({
                        ...values,
                        patientId: viewRecord.patientId,
                        doctorId: viewRecord.doctorId,
                      });
                      message.success(t('emr.vitalSaved'));
                      setVitalsFormOpen(false);
                      vitalsForm.resetFields();
                    } catch {
                      message.error(t('common.error'));
                    }
                  }}
                >
                  <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item name="systolicBp" label={t('emr.vitalBpSystolic')}>
                        <InputNumber placeholder="120" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="diastolicBp" label={t('emr.vitalBpDiastolic')}>
                        <InputNumber placeholder="80" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="heartRate" label={t('emr.vitalHeartRate')}>
                        <InputNumber placeholder="72" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="temperature" label={t('emr.vitalTemperature')}>
                        <InputNumber placeholder="36.6" step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item name="spo2" label={t('emr.vitalSpo2')}>
                        <InputNumber placeholder="98" suffix="%" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="glucose" label={t('emr.vitalGlucose')}>
                        <InputNumber placeholder="5.5" step={0.1} suffix={t('emr.vitalGlucoseUnit')} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="weight" label={t('emr.vitalWeight')}>
                        <InputNumber placeholder="70" suffix="кг" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="height" label={t('emr.vitalHeight')}>
                        <InputNumber placeholder="170" suffix="см" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={createVitalSigns.isPending} size="small">
                      {t('emr.vitalSave')}
                    </Button>
                    <Button size="small" onClick={() => { setVitalsFormOpen(false); vitalsForm.resetFields(); }}>
                      {t('common.cancel')}
                    </Button>
                  </Space>
                </Form>
              )}
            </div>

            {viewRecord.status === 'signed' && viewRecord.signatureHash && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#166534', fontSize: 14 }}>
                  <SafetyCertificateOutlined />
                  {t('emr.signatureTitle')}
                </div>
                {viewRecord.signatureImage && (
                  <img
                    src={viewRecord.signatureImage}
                    alt="Signature"
                    style={{ maxWidth: 200, maxHeight: 60, border: '1px solid #e5e7eb', borderRadius: 4, marginTop: 4 }}
                  />
                )}
                <div style={{ fontSize: 12, color: '#15803d' }}>
                  {t('emr.signedTimestamp')}: {viewRecord.signedAt ? new Date(viewRecord.signedAt).toLocaleString('ru-RU') : ''}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  SHA-256: {viewRecord.signatureHash}
                </div>
              </div>
            )}

            {/* File Attachments Section */}
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PaperClipOutlined style={{ color: 'var(--primary-500)' }} />
                  {t('emr.attachments')}
                </div>
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('emr.attachFile')}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              {uploadedFiles.length > 0 && (
                <List
                  size="small"
                  dataSource={uploadedFiles}
                  renderItem={(file) => (
                    <List.Item
                      style={{ padding: '6px 0' }}
                      actions={[
                        file.url ? (
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <DownloadOutlined />
                          </a>
                        ) : null,
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={<PaperClipOutlined style={{ fontSize: 16, color: 'var(--gray-400)' }} />}
                        title={<span style={{ fontSize: 13 }}>{file.name}</span>}
                        description={
                          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                            {(file.size / 1024).toFixed(1)} KB &bull; {new Date(file.date).toLocaleDateString('ru-RU')}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            {/* Prescriptions Section */}
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MedicineBoxOutlined style={{ color: 'var(--primary-500)' }} />
                  {t('emr.prescriptions')}
                </div>
                <Space>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => setPrescriptionFormOpen(!prescriptionFormOpen)}>
                    {t('emr.addPrescription')}
                  </Button>
                </Space>
              </div>

              {prescriptions.length === 0 && !prescriptionFormOpen && (
                <div style={{ color: 'var(--gray-400)', fontSize: 13, fontStyle: 'italic' }}>
                  {t('emr.noPrescriptions')}
                </div>
              )}

              {prescriptions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {prescriptions.map((rx) => (
                    <div key={rx.id} style={{
                      background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{rx.medicationName}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                          {rx.dosage} &middot; {rx.frequency}
                          {rx.duration && ` \u00B7 ${rx.duration}`}
                        </div>
                        {rx.instructions && (
                          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, fontStyle: 'italic' }}>
                            {rx.instructions}
                          </div>
                        )}
                      </div>
                      <Space size={4}>
                        <Tooltip title={t('emr.printPrescription')}>
                          <Button type="text" size="small" icon={<PrinterOutlined />} onClick={() => printPrescription(rx)} />
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <Button type="text" size="small" danger icon={<DeleteOutlined />}
                            onClick={() => deletePrescription.mutate(rx.id)} />
                        </Tooltip>
                      </Space>
                    </div>
                  ))}
                </div>
              )}

              {prescriptionFormOpen && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginTop: 8 }}>
                  <Form form={prescriptionForm} layout="vertical" onFinish={handleCreatePrescription} size="small">
                    <Form.Item name="medicationName" label={t('emr.medication')} rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                      <Input placeholder={t('emr.medication')} />
                    </Form.Item>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item name="dosage" label={t('emr.dosage')} rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                          <Input placeholder="500 \u043C\u0433" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="frequency" label={t('emr.frequency')} rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                          <Select placeholder={t('emr.frequency')} options={[
                            { value: t('emr.onceDaily'), label: t('emr.onceDaily') },
                            { value: t('emr.twiceDaily'), label: t('emr.twiceDaily') },
                            { value: t('emr.thriceDaily'), label: t('emr.thriceDaily') },
                            { value: t('emr.beforeSleep'), label: t('emr.beforeSleep') },
                          ]} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item name="duration" label={t('emr.courseDuration')} style={{ marginBottom: 8 }}>
                          <Input placeholder="7 \u0434\u043D\u0435\u0439" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="instructions" label={t('emr.instructions')} style={{ marginBottom: 8 }}>
                          <Input placeholder={t('emr.instructions')} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={createPrescription.isPending}>
                        {t('common.create')}
                      </Button>
                      <Button onClick={() => { setPrescriptionFormOpen(false); prescriptionForm.resetFields(); }}>
                        {t('common.cancel')}
                      </Button>
                    </Space>
                  </Form>
                </div>
              )}
            </div>

            {/* Referrals Section */}
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SendOutlined style={{ color: '#6366f1' }} />
                  {t('emr.referrals')}
                </div>
                <Button size="small" icon={<PlusOutlined />} onClick={() => setReferralModalOpen(true)}>
                  {t('emr.createReferral')}
                </Button>
              </div>

              {referrals.length === 0 && (
                <div style={{ color: 'var(--gray-400)', fontSize: 13, fontStyle: 'italic' }}>
                  {t('emr.noReferrals')}
                </div>
              )}

              {referrals.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {referrals.map((ref) => (
                    <div key={ref.id} style={{
                      background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{ref.targetSpecialty}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{ref.reason}</div>
                        <Space size={4} style={{ marginTop: 6 }}>
                          <Tag color={priorityColorMap[ref.priority] || 'default'}>
                            {t(`emr.${ref.priority}`)}
                          </Tag>
                          <Tag color={statusColorMap[ref.status] || 'default'}>
                            {t(`emr.status${ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}`)}
                          </Tag>
                        </Space>
                      </div>
                      {referralStatusFlow[ref.status] && (
                        <Button size="small" type="link"
                          onClick={() => changeReferralStatus.mutate({ id: ref.id, status: referralStatusFlow[ref.status] })}>
                          {t(`emr.status${referralStatusFlow[ref.status].charAt(0).toUpperCase() + referralStatusFlow[ref.status].slice(1)}`)}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Referral Modal */}
      <Modal
        title={t('emr.createReferral')}
        open={referralModalOpen}
        onCancel={() => { setReferralModalOpen(false); referralForm.resetFields(); }}
        onOk={() => referralForm.submit()}
        confirmLoading={createReferral.isPending}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
        width={480}
      >
        <Form form={referralForm} layout="vertical" onFinish={handleCreateReferral}>
          <Form.Item name="targetSpecialty" label={t('emr.targetSpecialty')} rules={[{ required: true }]}>
            <Input placeholder={t('emr.targetSpecialty')} />
          </Form.Item>
          <Form.Item name="reason" label={t('emr.reason')} rules={[{ required: true }]}>
            <TextArea rows={2} placeholder={t('emr.reason')} />
          </Form.Item>
          <Form.Item name="priority" label={t('emr.priority')} initialValue="routine">
            <Select options={[
              { value: 'routine', label: t('emr.routine') },
              { value: 'urgent', label: t('emr.urgent') },
              { value: 'emergency', label: t('emr.emergency') },
            ]} />
          </Form.Item>
          <Form.Item name="notes" label={t('emr.notes')}>
            <TextArea rows={2} placeholder={t('emr.notes')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Electronic Signature Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#10b981' }} />
            {t('emr.signatureTitle')}
          </Space>
        }
        open={signModalOpen}
        onCancel={() => { setSignModalOpen(false); setRecordToSign(null); }}
        onOk={handleSignSubmit}
        confirmLoading={signRecordMutation.isPending}
        okText={t('emr.signRecord')}
        cancelText={t('common.cancel')}
        width={560}
        okButtonProps={{ disabled: !signConfirmed }}
      >
        {recordToSign && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Record summary */}
            <div style={{
              background: 'var(--gray-50)', borderRadius: 12, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                <strong>{t('scheduling.patient')}:</strong>{' '}
                {(() => {
                  const p = (recordToSign as Record<string, unknown>).patient as { firstName?: string; lastName?: string } | undefined;
                  return p ? `${p.lastName || ''} ${p.firstName || ''}`.trim() : recordToSign.patientId?.slice(0, 8);
                })()}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                <strong>{t('emr.diagnosis')}:</strong> {recordToSign.diagnosis}
                {recordToSign.diagnosisCode && ` (${recordToSign.diagnosisCode})`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                <strong>{t('common.date')}:</strong>{' '}
                {new Date(recordToSign.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>

            {/* Signature area */}
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                {t('emr.signatureArea')}
              </div>
              <Tabs
                activeKey={signatureMode}
                onChange={(k) => setSignatureMode(k as 'draw' | 'type')}
                items={[
                  {
                    key: 'draw',
                    label: t('emr.drawSignature'),
                    children: (
                      <SignatureCanvas
                        width={480}
                        height={120}
                        onChange={(base64) => setSignatureImage(base64)}
                      />
                    ),
                  },
                  {
                    key: 'type',
                    label: t('emr.typeSignature'),
                    children: (
                      <Input
                        placeholder={t('emr.typeSignaturePlaceholder')}
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        style={{ fontSize: 20, fontFamily: "'Caveat', cursive", height: 50 }}
                      />
                    ),
                  },
                ]}
              />
            </div>

            {/* Confirmation checkbox */}
            <Checkbox
              checked={signConfirmed}
              onChange={(e) => setSignConfirmed(e.target.checked)}
              style={{ fontSize: 13 }}
            >
              {t('emr.signatureConfirmation')}
            </Checkbox>
          </div>
        )}
      </Modal>

      {/* Template Selection Drawer */}
      <Drawer
        title={t('emr.selectTemplate')}
        placement="right"
        width={400}
        open={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
      >
        {templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
            <FileTextOutlined style={{ fontSize: 40, marginBottom: 12 }} />
            <div>{t('emr.noTemplates')}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {templates.map((tmpl) => (
              <Card
                key={tmpl.id}
                hoverable
                size="small"
                onClick={() => handleSelectTemplate(tmpl)}
                style={{ cursor: 'pointer', borderRadius: 10 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{tmpl.name}</div>
                    {tmpl.specialty && (
                      <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>{tmpl.specialty}</Tag>
                    )}
                  </div>
                  <FileTextOutlined style={{ fontSize: 20, color: 'var(--gray-300)' }} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EmrPage;

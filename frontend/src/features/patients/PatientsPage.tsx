import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  DatePicker,
  Select,
  Row,
  Col,
  Drawer,
  Descriptions,
  Tabs,
  Timeline,
  Segmented,
  Divider,
  Tooltip,
  Avatar,
  message,
  Upload,
  Progress,
  Dropdown,
  Radio,
  List,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  IdcardOutlined,
  DollarOutlined,
  DownloadOutlined,
  UploadOutlined,
  CameraOutlined,
  MergeCellsOutlined,
  TagOutlined,
  FileOutlined,
  InboxOutlined,
  FilterOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import apiClient from '../../api/client';
import { usePatients, useCreatePatient, useUpdatePatient, usePatientHistory, usePatientSearch } from '../../hooks/usePatients';
import { useMedicalRecords } from '../../hooks/useEmr';
import { useInvoices } from '../../hooks/useBilling';
import type { Patient, Appointment, MedicalRecord, Invoice } from '../../types';
import { formatCurrency } from '../../utils/format';

const { Text } = Typography;

const getInitials = (first: string, last: string) =>
  `${last.charAt(0)}${first.charAt(0)}`.toUpperCase();

const avatarColors = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length];

const PatientsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ added: number; errors: number } | null>(null);
  const [duplicateCheckOpen, setDuplicateCheckOpen] = useState(false);
  const [duplicatePatient, setDuplicatePatient] = useState<Patient | null>(null);
  const [pendingValues, setPendingValues] = useState<Record<string, unknown> | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [primaryMergeId, setPrimaryMergeId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterGender, setFilterGender] = useState<string | undefined>(undefined);
  const [filterBloodType, setFilterBloodType] = useState<string | undefined>(undefined);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterAgeFrom, setFilterAgeFrom] = useState<number | null>(null);
  const [filterAgeTo, setFilterAgeTo] = useState<number | null>(null);
  const [form] = Form.useForm();

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchText]);

  const { data: patientsData, isLoading } = usePatients({ search: debouncedSearch || undefined, page, limit: 20 });
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  const patients = patientsData?.data || [];
  const total = patientsData?.total || 0;

  const filteredPatients = patients.filter((p) => {
    if (activeFilter === 'vip' && !p.tags?.includes('VIP')) return false;
    if (activeFilter === 'recent') {
      const created = new Date(p.createdAt);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (created < threeMonthsAgo) return false;
    }
    if (filterGender && p.gender !== filterGender) return false;
    if (filterBloodType && p.bloodType !== filterBloodType) return false;
    if (filterTags.length > 0 && !filterTags.every((tag) => p.tags?.includes(tag))) return false;
    if (filterAgeFrom !== null || filterAgeTo !== null) {
      if (!p.dateOfBirth) return false;
      const age = dayjs().diff(dayjs(p.dateOfBirth), 'year');
      if (filterAgeFrom !== null && age < filterAgeFrom) return false;
      if (filterAgeTo !== null && age > filterAgeTo) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setFilterGender(undefined);
    setFilterBloodType(undefined);
    setFilterTags([]);
    setFilterAgeFrom(null);
    setFilterAgeTo(null);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    form.setFieldsValue({
      ...patient,
      dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : undefined,
    });
    setIsModalOpen(true);
  };

  // Duplicate check via phone search
  const [dupCheckPhone, setDupCheckPhone] = useState('');
  const { data: dupSearchResults } = usePatientSearch(dupCheckPhone);

  const handleSave = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      dateOfBirth: values.dateOfBirth
        ? (values.dateOfBirth as { format: (f: string) => string }).format('YYYY-MM-DD')
        : undefined,
    };

    // Duplicate check for new patients only
    if (!editingPatient && payload.phone) {
      const phone = String(payload.phone).trim();
      if (phone.length >= 2) {
        // Search existing patients by phone
        const matchingPatients = (dupSearchResults || []).filter(
          (p) => p.phone && p.phone.replace(/\D/g, '').includes(phone.replace(/\D/g, '')),
        );
        if (matchingPatients.length > 0) {
          setDuplicatePatient(matchingPatients[0]);
          setPendingValues(payload);
          setDuplicateCheckOpen(true);
          return;
        }
      }
    }

    await doSave(payload);
  };

  const doSave = async (payload: Record<string, unknown>) => {
    try {
      if (editingPatient) {
        await updatePatient.mutateAsync({ id: editingPatient.id, data: payload });
        message.success(t('common.success'));
      } else {
        await createPatient.mutateAsync(payload);
        message.success(t('common.success'));
      }
      setIsModalOpen(false);
      setEditingPatient(null);
      form.resetFields();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleDuplicateConfirm = async () => {
    setDuplicateCheckOpen(false);
    setDuplicatePatient(null);
    if (pendingValues) {
      await doSave(pendingValues);
      setPendingValues(null);
    }
  };

  const handleDuplicateCancel = () => {
    setDuplicateCheckOpen(false);
    setDuplicatePatient(null);
    setPendingValues(null);
  };

  // Merge duplicates handler
  const handleMerge = async () => {
    if (!primaryMergeId || selectedRowKeys.length !== 2) return;
    setMerging(true);
    try {
      const duplicateIds = selectedRowKeys.filter((k) => String(k) !== primaryMergeId).map(String);
      await apiClient.post('/patients/merge', { primaryId: primaryMergeId, duplicateIds });
      message.success(t('patients.mergeSuccess'));
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setPrimaryMergeId(null);
    } catch {
      message.error(t('common.error'));
    } finally {
      setMerging(false);
    }
  };

  // Mass tagging handler
  const handleMassTag = async (tag: string) => {
    let successCount = 0;
    for (const key of selectedRowKeys) {
      try {
        const patient = patients.find((p) => p.id === key);
        const existingTags = patient?.tags || [];
        if (!existingTags.includes(tag)) {
          await updatePatient.mutateAsync({ id: String(key), data: { tags: [...existingTags, tag] } });
          successCount++;
        }
      } catch { /* skip failed */ }
    }
    message.success(t('patients.tagAddedCount', { count: successCount }));
    setSelectedRowKeys([]);
  };

  const selectedPatients = patients.filter((p) => selectedRowKeys.includes(p.id));

  // Trigger duplicate phone search when phone field changes
  useEffect(() => {
    const phone = form.getFieldValue('phone');
    if (phone && String(phone).trim().length >= 3 && !editingPatient) {
      setDupCheckPhone(String(phone).trim());
    } else {
      setDupCheckPhone('');
    }
  }, [form, editingPatient]);

  // CSV Export
  const handleExportCSV = () => {
    const csvHeaders = ['lastName', 'firstName', 'middleName', 'phone', 'email', 'dateOfBirth', 'gender'];
    const csvRows = patients.map((p: Patient) =>
      csvHeaders
        .map((h) => {
          const val = String((p as Record<string, unknown>)[h] || '');
          return val.includes(',') || val.includes(';') || val.includes('"')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(','),
    );
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patients_export_${dayjs().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(t('patients.exportSuccess'));
  };

  // CSV Import parsing
  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        message.error(t('patients.importNoData'));
        return;
      }
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = vals[i] || '';
        });
        return row;
      });
      setImportData(rows);
      setImportResult(null);
      setImportProgress(0);
    };
    reader.readAsText(file);
    return false; // prevent auto-upload
  };

  // CSV Import execution
  const handleImportExecute = async () => {
    setImporting(true);
    setImportProgress(0);
    let added = 0;
    let errors = 0;
    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      try {
        await createPatient.mutateAsync({
          lastName: row.lastName || row['Фамилия'] || '',
          firstName: row.firstName || row['Имя'] || '',
          middleName: row.middleName || row['Отчество'] || '',
          phone: row.phone || row['Телефон'] || '',
          email: row.email || row['Email'] || '',
          dateOfBirth: row.dateOfBirth || row['Дата рождения'] || '',
          gender: (row.gender || row['Пол'] || 'male') as 'male' | 'female',
        } as Partial<Patient>);
        added++;
      } catch {
        errors++;
      }
      setImportProgress(Math.round(((i + 1) / importData.length) * 100));
    }
    setImporting(false);
    setImportResult({ added, errors });
    message.success(t('patients.importDone', { added, errors }));
  };

  const columns = [
    {
      title: t('common.patient'),
      key: 'patient',
      sorter: (a: Patient, b: Patient) => a.lastName.localeCompare(b.lastName),
      render: (_: unknown, record: Patient) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            style={{
              background: getAvatarColor(record.id),
              fontWeight: 600,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {getInitials(record.firstName, record.lastName)}
          </Avatar>
          <div>
            <Text
              strong
              style={{ fontSize: 14, color: '#1a1a2e', cursor: 'pointer', lineHeight: 1.3 }}
              onClick={() => {
                setSelectedPatient(record);
                setIsDrawerOpen(true);
              }}
            >
              {record.lastName} {record.firstName} {record.middleName || ''}
            </Text>
            {record.email && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                <MailOutlined style={{ marginRight: 4 }} />
                {record.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t('patients.phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => (
        <span style={{ color: '#64748b', fontSize: 13 }}>
          <PhoneOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
          {phone}
        </span>
      ),
    },
    {
      title: t('patients.dateOfBirth'),
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (date: string) => (
        <span style={{ color: '#64748b', fontSize: 13 }}>
          {new Date(date).toLocaleDateString('ru-RU')}
        </span>
      ),
    },
    {
      title: t('patients.age'),
      key: 'age',
      width: 80,
      render: (_: unknown, record: Patient) => (
        <span style={{ color: '#64748b', fontSize: 13 }}>
          {record.dateOfBirth
            ? `${dayjs().diff(dayjs(record.dateOfBirth), 'year')} ${t('patients.years')}`
            : '\u2014'}
        </span>
      ),
    },
    {
      title: t('common.tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[] | undefined) =>
        tags?.map((tag) => (
          <Tag
            key={tag}
            style={{
              borderRadius: 20,
              border: 'none',
              fontWeight: 600,
              fontSize: 11,
              padding: '2px 12px',
              ...(tag === 'VIP'
                ? { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f' }
                : tag === 'blacklist'
                  ? { background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff' }
                  : {}),
            }}
          >
            {tag}
          </Tag>
        )),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Patient) => (
        <Space size={4}>
          <Tooltip title={t('common.view')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              style={{ color: '#94a3b8', borderRadius: 8 }}
              onClick={() => {
                setSelectedPatient(record);
                setIsDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: '#94a3b8', borderRadius: 8 }}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>{t('patients.title')}</h2>
          <div className="page-header-subtitle">
            {t('patients.totalInBase', { count: total })}
          </div>
        </div>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleExportCSV}
            style={{ borderRadius: 12, height: 44, fontWeight: 600 }}
          >
            {t('patients.export')}
          </Button>
          <Button
            icon={<UploadOutlined />}
            size="large"
            onClick={() => { setImportModalOpen(true); setImportData([]); setImportResult(null); }}
            style={{ borderRadius: 12, height: 44, fontWeight: 600 }}
          >
            {t('patients.import')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalOpen(true)}
            style={{ borderRadius: 12, height: 44, fontWeight: 600, paddingInline: 24 }}
          >
            {t('patients.addPatient')}
          </Button>
        </Space>
      </div>

      {/* Total count */}
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500, color: '#64748b' }}>
        {t('patients.totalPatients', { count: filteredPatients.length })}
      </div>

      {/* Search & Filter Card */}
      <div className="modern-card" style={{ marginBottom: 24 }}>
        <div className="modern-card-header" style={{ flexWrap: 'wrap', gap: 16 }}>
          <Input
            placeholder={t('patients.search')}
            prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 18 }} />}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            allowClear
            size="large"
            style={{
              borderRadius: 12,
              maxWidth: 420,
              flex: 1,
              border: '1px solid #e2e8f0',
            }}
          />
          <Button
            icon={<FilterOutlined />}
            size="large"
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              borderRadius: 12,
              height: 44,
              fontWeight: 600,
              ...(filtersOpen ? { borderColor: '#6366f1', color: '#6366f1' } : {}),
            }}
          >
            {t('patients.filters')}
          </Button>
          <Segmented
            value={activeFilter}
            onChange={(val) => setActiveFilter(val as string)}
            options={[
              { label: t('scheduling.all'), value: 'all' },
              { label: 'VIP', value: 'vip' },
              { label: t('dashboard.newPatients'), value: 'recent' },
            ]}
            style={{ borderRadius: 10 }}
          />
        </div>
        {filtersOpen && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ minWidth: 140 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{t('patients.gender')}</Text>
              <Select
                value={filterGender}
                onChange={(val) => setFilterGender(val || undefined)}
                allowClear
                placeholder={t('patients.genderAll')}
                style={{ width: 140, borderRadius: 10 }}
                options={[
                  { value: 'male', label: t('patients.male') },
                  { value: 'female', label: t('patients.female') },
                ]}
              />
            </div>
            <div style={{ minWidth: 140 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{t('patients.bloodType')}</Text>
              <Select
                value={filterBloodType}
                onChange={(val) => setFilterBloodType(val || undefined)}
                allowClear
                placeholder={t('patients.bloodTypeAll')}
                style={{ width: 140, borderRadius: 10 }}
                options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }))}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{t('common.tags')}</Text>
              <Select
                mode="multiple"
                value={filterTags}
                onChange={(val) => setFilterTags(val)}
                placeholder={t('common.tags')}
                style={{ width: 160, borderRadius: 10 }}
                options={[
                  { value: 'VIP', label: 'VIP' },
                  { value: 'blacklist', label: 'blacklist' },
                ]}
              />
            </div>
            <div style={{ minWidth: 200 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{t('patients.age')}</Text>
              <Space>
                <InputNumber
                  min={0}
                  max={150}
                  value={filterAgeFrom}
                  onChange={(val) => setFilterAgeFrom(val)}
                  placeholder={t('patients.ageFrom')}
                  style={{ width: 80, borderRadius: 10 }}
                />
                <span style={{ color: '#94a3b8' }}>—</span>
                <InputNumber
                  min={0}
                  max={150}
                  value={filterAgeTo}
                  onChange={(val) => setFilterAgeTo(val)}
                  placeholder={t('patients.ageTo')}
                  style={{ width: 80, borderRadius: 10 }}
                />
              </Space>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button onClick={resetFilters} style={{ borderRadius: 10 }}>
                {t('patients.resetFilters')}
              </Button>
            </div>
          </div>
        )}
        {/* Floating Action Bar for batch operations */}
        {selectedRowKeys.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            borderBottom: '1px solid #c7d2fe',
          }}>
            <Text strong style={{ color: '#4338ca', fontSize: 13 }}>
              {t('patients.selectedCount', { count: selectedRowKeys.length })}
            </Text>
            <div style={{ flex: 1 }} />
            {selectedRowKeys.length === 2 && (
              <Button
                icon={<MergeCellsOutlined />}
                onClick={() => {
                  setPrimaryMergeId(String(selectedRowKeys[0]));
                  setMergeModalOpen(true);
                }}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                {t('patients.merge')}
              </Button>
            )}
            <Dropdown
              menu={{
                items: [
                  { key: 'VIP', label: 'VIP' },
                  { key: 'blacklist', label: t('patients.blacklist') },
                ],
                onClick: ({ key }) => handleMassTag(key),
              }}
            >
              <Button
                icon={<TagOutlined />}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                {t('patients.addTag')}
              </Button>
            </Dropdown>
            <Button
              type="text"
              onClick={() => setSelectedRowKeys([])}
              style={{ color: '#64748b', fontWeight: 500 }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        )}
        <div className="modern-card-body" style={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredPatients}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 900 }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            pagination={{
              current: page,
              pageSize: 20,
              total,
              onChange: (p) => setPage(p),
              showTotal: (total) => `${t('common.total')}: ${total}`,
            }}
            style={{ borderRadius: 0 }}
            rowClassName={() => 'patients-table-row'}
          />
        </div>
      </div>

      {/* Create Patient Modal */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingPatient(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createPatient.isPending || updatePatient.isPending}
        width={760}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        styles={{
          body: { padding: '8px 0 0 0' },
          header: { padding: 0, border: 'none' },
        }}
        style={{ borderRadius: 16 }}
      >
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 20, color: '#1a1a2e' }}>
            {editingPatient ? t('patients.editPatient') : t('patients.addPatient')}
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSave}>
          {/* Section: Personal Data */}
          <Divider orientationMargin={0} style={{ fontSize: 14, color: '#6366f1', fontWeight: 600 }}>
            <UserOutlined style={{ marginRight: 6 }} /> {t('patients.personalData')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="lastName" label={t('patients.lastName')} rules={[{ required: true }]}>
                <Input style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="firstName" label={t('patients.firstName')} rules={[{ required: true }]}>
                <Input style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="middleName" label={t('patients.middleName')}>
                <Input style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="dateOfBirth" label={t('patients.dateOfBirth')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%', borderRadius: 10 }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="gender" label={t('patients.gender')} rules={[{ required: true }]}>
                <Select
                  style={{ borderRadius: 10 }}
                  options={[
                    { value: 'male', label: t('patients.male') },
                    { value: 'female', label: t('patients.female') },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="passportNumber" label={t('patients.passport')}>
                <Input style={{ borderRadius: 10 }} prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />} />
              </Form.Item>
            </Col>
          </Row>

          {/* Section: Contacts */}
          <Divider orientationMargin={0} style={{ fontSize: 14, color: '#6366f1', fontWeight: 600 }}>
            <PhoneOutlined style={{ marginRight: 6 }} /> {t('patients.contacts')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="phone" label={t('patients.phone')} rules={[{ required: true }]}>
                <Input
                  style={{ borderRadius: 10 }}
                  placeholder="+992..."
                  prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                  onBlur={(e) => {
                    if (!editingPatient && e.target.value.trim().length >= 3) {
                      setDupCheckPhone(e.target.value.trim());
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="email" label={t('patients.email')}>
                <Input style={{ borderRadius: 10 }} prefix={<MailOutlined style={{ color: '#94a3b8' }} />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="address" label={t('patients.address')}>
                <Input style={{ borderRadius: 10 }} prefix={<HomeOutlined style={{ color: '#94a3b8' }} />} />
              </Form.Item>
            </Col>
          </Row>

          {/* Section: Medical Info */}
          <Divider orientationMargin={0} style={{ fontSize: 14, color: '#6366f1', fontWeight: 600 }}>
            <MedicineBoxOutlined style={{ marginRight: 6 }} /> {t('patients.medicalInfo')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="bloodType" label={t('patients.bloodType')}>
                <Select
                  allowClear
                  placeholder={t('common.search')}
                  options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item name="allergies" label={t('patients.allergies')}>
                <Input.TextArea rows={1} style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>

          {/* Section: Insurance */}
          <Divider orientationMargin={0} style={{ fontSize: 14, color: '#6366f1', fontWeight: 600 }}>
            <SafetyCertificateOutlined style={{ marginRight: 6 }} /> {t('patients.insuranceSection')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="insurancePolicyNumber" label={t('patients.insurancePolicyNumber')}>
                <Input style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Patient Detail Drawer */}
      <Drawer
        title={null}
        placement="right"
        width={680}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {selectedPatient && (
          <PatientDrawerContent patient={selectedPatient} t={t} />
        )}
      </Drawer>

      {/* CSV Import Modal */}
      <Modal
        title={t('patients.importTitle')}
        open={importModalOpen}
        onCancel={() => { setImportModalOpen(false); setImportData([]); setImportResult(null); }}
        footer={importData.length > 0 && !importResult ? [
          <Button key="cancel" onClick={() => { setImportModalOpen(false); setImportData([]); }}>
            {t('common.cancel')}
          </Button>,
          <Button key="import" type="primary" loading={importing} onClick={handleImportExecute}>
            {t('patients.importBtn')} ({importData.length})
          </Button>,
        ] : [
          <Button key="close" onClick={() => { setImportModalOpen(false); setImportData([]); setImportResult(null); }}>
            {t('common.close')}
          </Button>,
        ]}
        width={800}
      >
        {importData.length === 0 && !importResult && (
          <Upload.Dragger
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => handleImportFile(file)}
          >
            <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 40, color: '#6366f1' }} /></p>
            <p className="ant-upload-text">{t('patients.importDragText')}</p>
            <p className="ant-upload-hint">{t('patients.importHint')}</p>
          </Upload.Dragger>
        )}
        {importing && <Progress percent={importProgress} style={{ marginBottom: 16 }} />}
        {importResult && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {t('patients.importDone', { added: importResult.added, errors: importResult.errors })}
            </div>
          </div>
        )}
        {importData.length > 0 && !importResult && (
          <Table
            size="small"
            dataSource={importData.slice(0, 10).map((row, i) => ({ ...row, key: i }))}
            columns={[
              { title: t('patients.lastName'), dataIndex: 'lastName', key: 'lastName' },
              { title: t('patients.firstName'), dataIndex: 'firstName', key: 'firstName' },
              { title: t('patients.phone'), dataIndex: 'phone', key: 'phone' },
              { title: t('patients.dateOfBirth'), dataIndex: 'dateOfBirth', key: 'dateOfBirth' },
              { title: t('patients.gender'), dataIndex: 'gender', key: 'gender' },
            ]}
            pagination={false}
            scroll={{ x: 600 }}
            style={{ marginTop: 16 }}
            footer={() => importData.length > 10 ? `... ${t('common.total')}: ${importData.length}` : undefined}
          />
        )}
      </Modal>

      {/* Duplicate Patient Check Modal */}
      <Modal
        title={t('patients.duplicateFound')}
        open={duplicateCheckOpen}
        onOk={handleDuplicateConfirm}
        onCancel={handleDuplicateCancel}
        okText={t('common.yes')}
        cancelText={t('common.no')}
      >
        {duplicatePatient && (
          <p>
            {t('patients.duplicateMessage', {
              name: `${duplicatePatient.lastName} ${duplicatePatient.firstName}`,
              phone: duplicatePatient.phone || '',
            })}
          </p>
        )}
      </Modal>

      {/* Merge Patients Modal */}
      <Modal
        title={t('patients.mergeTitle')}
        open={mergeModalOpen}
        onCancel={() => { setMergeModalOpen(false); setPrimaryMergeId(null); }}
        onOk={handleMerge}
        confirmLoading={merging}
        okText={t('patients.mergeConfirm')}
        cancelText={t('common.cancel')}
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">{t('patients.mergeDescription')}</Text>
        </div>
        <Radio.Group
          value={primaryMergeId}
          onChange={(e) => setPrimaryMergeId(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={16}>
            {selectedPatients.slice(0, 2).map((p) => (
              <Col span={12} key={p.id}>
                <div
                  style={{
                    border: primaryMergeId === p.id ? '2px solid #6366f1' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: primaryMergeId === p.id ? '#f5f3ff' : '#fff',
                  }}
                  onClick={() => setPrimaryMergeId(p.id)}
                >
                  <Radio value={p.id} style={{ marginBottom: 12 }}>
                    <Text strong>{t('patients.primaryRecord')}</Text>
                  </Radio>
                  <Descriptions column={1} size="small" colon={false}>
                    <Descriptions.Item label={t('common.patient')}>
                      {p.lastName} {p.firstName} {p.middleName || ''}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('patients.phone')}>
                      {p.phone || '---'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('patients.dateOfBirth')}>
                      {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('ru-RU') : '---'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('common.tags')}>
                      {p.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>) || '---'}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </Modal>
    </div>
  );
};

interface UploadedDoc {
  uid: string;
  name: string;
  size: number;
  uploadedAt: string;
  url?: string;
}

const PatientDrawerContent: React.FC<{ patient: Patient; t: (key: string, options?: Record<string, unknown>) => string }> = ({ patient, t }) => {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(patient.photoUrl);
  const [photoHover, setPhotoHover] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post(`/patients/${patient.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(res.data?.url || URL.createObjectURL(file));
      message.success(t('patients.photoUploaded'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleDocUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patient.id);
    try {
      const res = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newDoc: UploadedDoc = {
        uid: res.data?.id || `${Date.now()}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: res.data?.url,
      };
      setUploadedDocs((prev) => [...prev, newDoc]);
      message.success(t('patients.documentUploaded'));
    } catch {
      // Fallback: still add to local state for UX
      setUploadedDocs((prev) => [
        ...prev,
        {
          uid: `${Date.now()}`,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      ]);
      message.warning(t('patients.documentSavedLocally'));
    }
    return false; // prevent default upload
  };

  const typeLabels: Record<string, string> = {
    primary: t('scheduling.primary'),
    follow_up: t('scheduling.followUp'),
    procedure: t('scheduling.procedure'),
    consultation: t('scheduling.consultation'),
  };

  const statusLabels: Record<string, string> = {
    scheduled: t('scheduling.scheduled'),
    confirmed: t('scheduling.confirmed'),
    in_progress: t('scheduling.inProgress'),
    completed: t('scheduling.completed'),
    cancelled: t('scheduling.cancelled'),
    no_show: t('scheduling.noShow'),
  };
  const { data: history } = usePatientHistory(patient.id);
  const { data: recordsData } = useMedicalRecords({ patientId: patient.id });
  const { data: invoicesData } = useInvoices({ patientId: patient.id });
  const medRecords: MedicalRecord[] = recordsData?.data || [];
  const invoices: Invoice[] = invoicesData?.data || (Array.isArray(invoicesData) ? invoicesData : []);

  const appointments: Appointment[] = Array.isArray(history) ? history : [];

  const historyItems = appointments.map((apt: Appointment, i: number) => {
    const doctorName = apt.doctor
      ? `${apt.doctor.lastName} ${apt.doctor.firstName}`
      : '';
    const linkedRecord = medRecords.find((r) => r.appointmentId === apt.id);
    return {
      color: apt.status === 'completed' ? '#10b981' : apt.status === 'cancelled' ? '#ef4444' : '#3b82f6',
      children: (
        <div>
          <Text strong style={{ fontSize: 13 }}>{typeLabels[apt.type] || apt.type || t('common.visit')}</Text>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            {apt.date ? new Date(apt.date).toLocaleDateString('ru-RU') : ''}
            {apt.startTime ? `, ${apt.startTime.slice(0, 5)}` : ''}
            {doctorName ? ` — ${doctorName}` : ''}
          </div>
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Tag style={{ borderRadius: 20, fontSize: 11, margin: 0 }} color={apt.status === 'completed' ? 'green' : apt.status === 'cancelled' ? 'red' : 'blue'}>
              {statusLabels[apt.status] || apt.status}
            </Tag>
            {linkedRecord && (
              <Tag style={{ borderRadius: 20, fontSize: 11, margin: 0 }} color="purple">
                {t('emr.diagnosis')}: {linkedRecord.diagnosis}
                {linkedRecord.diagnosisCode ? ` (${linkedRecord.diagnosisCode})` : ''}
              </Tag>
            )}
          </div>
        </div>
      ),
    };
  });

  // Add standalone medical records (not linked to appointments)
  const standaloneRecords = medRecords
    .filter((r) => !r.appointmentId || !appointments.some((a) => a.id === r.appointmentId))
    .map((r) => ({
      color: r.status === 'signed' ? '#10b981' : '#f59e0b',
      children: (
        <div>
          <Text strong style={{ fontSize: 13 }}>{t('nav.emr')} — {r.diagnosis}</Text>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            {r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : ''}
            {r.diagnosisCode ? ` · ${r.diagnosisCode}` : ''}
          </div>
          <Tag style={{ marginTop: 4, borderRadius: 20, fontSize: 11 }} color={r.status === 'signed' ? 'green' : 'orange'}>
            {r.status === 'signed' ? t('emr.signed') : r.status === 'draft' ? t('emr.draft') : r.status}
          </Tag>
        </div>
      ),
    }));

  const invoiceStatusColors: Record<string, string> = {
    paid: '#10b981',
    pending: '#f59e0b',
    draft: '#94a3b8',
    partially_paid: '#3b82f6',
    cancelled: '#ef4444',
    refunded: '#6b7280',
  };

  const invoiceStatusLabels: Record<string, string> = {
    paid: t('billing.paid'),
    pending: t('billing.pending'),
    draft: t('billing.draft'),
    partially_paid: t('billing.partiallyPaid'),
    cancelled: t('scheduling.cancelled'),
    refunded: t('billing.refunded'),
  };

  const invoiceItems = invoices.map((inv) => ({
    color: invoiceStatusColors[inv.status] || '#94a3b8',
    date: inv.createdAt,
    children: (
      <div>
        <Text strong style={{ fontSize: 13 }}>
          <DollarOutlined style={{ marginRight: 4, color: invoiceStatusColors[inv.status] }} />
          {t('nav.invoices')} #{inv.invoiceNumber}
        </Text>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('ru-RU') : ''}
          {' · '}{formatCurrency(inv.finalAmount || 0)}
        </div>
        <Tag style={{ marginTop: 4, borderRadius: 20, fontSize: 11 }} color={inv.status === 'paid' ? 'green' : inv.status === 'pending' ? 'orange' : 'default'}>
          {invoiceStatusLabels[inv.status] || inv.status}
        </Tag>
      </div>
    ),
  }));

  const allHistoryItems = [
    ...historyItems.map((h, i) => ({ ...h, type: 'appointment' as const, date: appointments[i]?.date || '' })),
    ...standaloneRecords.map((r, i) => {
      const rec = medRecords.filter((mr) => !mr.appointmentId || !appointments.some((a) => a.id === mr.appointmentId))[i];
      return { ...r, type: 'medical' as const, date: rec?.createdAt || '' };
    }),
    ...invoiceItems.map((item) => ({ ...item, type: 'invoice' as const })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const filteredHistoryItems = historyFilter === 'all'
    ? allHistoryItems
    : allHistoryItems.filter((item) => {
        if (historyFilter === 'appointments') return item.type === 'appointment';
        if (historyFilter === 'medical') return item.type === 'medical';
        if (historyFilter === 'invoices') return item.type === 'invoice';
        return true;
      });

  return (
    <>
      {/* Drawer Header */}
      <div
        style={{
          padding: '32px 24px 24px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoUpload}
        />
        <div
          style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={() => setPhotoHover(true)}
          onMouseLeave={() => setPhotoHover(false)}
          onClick={() => photoInputRef.current?.click()}
        >
          <Avatar
            size={72}
            src={photoUrl}
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              fontSize: 26,
              fontWeight: 700,
              color: '#fff',
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            {!photoUrl && getInitials(patient.firstName, patient.lastName)}
          </Avatar>
          {photoHover && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CameraOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
          )}
        </div>
        <div>
          <Text
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 700,
              display: 'block',
              lineHeight: 1.2,
            }}
          >
            {patient.lastName} {patient.firstName} {patient.middleName || ''}
          </Text>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            {patient.tags?.map((tag) => (
              <Tag
                key={tag}
                style={{
                  borderRadius: 20,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 11,
                  padding: '2px 12px',
                  ...(tag === 'VIP'
                    ? { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f' }
                    : tag === 'blacklist'
                      ? { background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.2)', color: '#fff' }),
                }}
              >
                {tag}
              </Tag>
            ))}
            <Tag
              style={{
                borderRadius: 20,
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: 11,
                padding: '2px 12px',
              }}
            >
              {t(`patients.${patient.gender}`)}
            </Tag>
          </div>
        </div>
      </div>

      {/* Drawer Tabs */}
      <div style={{ padding: '0 24px 24px' }}>
        <Tabs
          defaultActiveKey="info"
          style={{ marginTop: 8 }}
          items={[
            {
              key: 'info',
              label: t('patients.personalData'),
              children: (
                <>
                <Descriptions
                  column={2}
                  size="small"
                  colon={false}
                  labelStyle={{ color: '#94a3b8', fontWeight: 500, fontSize: 13, paddingBottom: 4 }}
                  contentStyle={{ fontWeight: 500, fontSize: 14, color: '#1a1a2e', paddingBottom: 16 }}
                >
                  <Descriptions.Item label={<span><CalendarOutlined style={{ marginRight: 6 }} />{t('patients.dateOfBirth')}</span>}>
                    {new Date(patient.dateOfBirth).toLocaleDateString('ru-RU')}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span><UserOutlined style={{ marginRight: 6 }} />{t('patients.gender')}</span>}>
                    {t(`patients.${patient.gender}`)}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span><PhoneOutlined style={{ marginRight: 6 }} />{t('patients.phone')}</span>}>
                    {patient.phone || '---'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span><MailOutlined style={{ marginRight: 6 }} />{t('patients.email')}</span>}>
                    {patient.email || '---'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span><HomeOutlined style={{ marginRight: 6 }} />{t('patients.address')}</span>} span={2}>
                    {patient.address || '---'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span><HeartOutlined style={{ marginRight: 6 }} />{t('patients.bloodType')}</span>}>
                    {patient.bloodType ? <Tag color="blue" style={{ borderRadius: 20 }}>{patient.bloodType}</Tag> : '---'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span><MedicineBoxOutlined style={{ marginRight: 6 }} />{t('patients.allergies')}</span>}>
                    {patient.allergies ? <Tag color="red" style={{ borderRadius: 20, fontWeight: 500 }}>{patient.allergies}</Tag> : '---'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span><SafetyCertificateOutlined style={{ marginRight: 6 }} />{t('patients.insurancePolicyNumber')}</span>} span={2}>
                    {patient.insurancePolicyNumber || '---'}
                  </Descriptions.Item>
                </Descriptions>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>
                    <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                    {t('patients.consentSection')}
                  </Text>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {patient.consentGiven ? (
                      <Tag color="green" style={{ borderRadius: 20, fontWeight: 600 }}>{t('patients.consentGiven')}</Tag>
                    ) : (
                      <>
                        <Tag color="default" style={{ borderRadius: 20, fontWeight: 600 }}>{t('patients.consentNotGiven')}</Tag>
                        <ConsentButton patientId={patient.id} t={t} />
                      </>
                    )}
                  </div>
                </div>
                </>
              ),
            },
            {
              key: 'history',
              label: t('patients.history'),
              children: (
                <div>
                  <Segmented
                    value={historyFilter}
                    onChange={(val) => setHistoryFilter(val as string)}
                    options={[
                      { label: t('patients.historyAll'), value: 'all' },
                      { label: t('patients.historyAppointments'), value: 'appointments' },
                      { label: t('patients.historyMedical'), value: 'medical' },
                      { label: t('patients.historyInvoices'), value: 'invoices' },
                    ]}
                    style={{ marginTop: 8, marginBottom: 16 }}
                    block
                  />
                  <Timeline
                    items={filteredHistoryItems.length > 0 ? filteredHistoryItems : [{
                      color: '#94a3b8',
                      children: <Text type="secondary">{t('patients.noHistory')}</Text>,
                    }]}
                  />
                </div>
              ),
            },
            {
              key: 'documents',
              label: t('nav.documents'),
              children: (
                <div>
                  <Upload.Dragger
                    showUploadList={false}
                    beforeUpload={(file) => { handleDocUpload(file); return false; }}
                    style={{ marginBottom: 16 }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ fontSize: 36, color: '#6366f1' }} />
                    </p>
                    <p className="ant-upload-text">{t('patients.uploadDocText')}</p>
                  </Upload.Dragger>
                  {uploadedDocs.length > 0 ? (
                    <List
                      size="small"
                      dataSource={uploadedDocs}
                      renderItem={(doc) => (
                        <List.Item
                          actions={[
                            doc.url ? (
                              <Button
                                key="download"
                                type="link"
                                size="small"
                                icon={<DownloadOutlined />}
                                href={doc.url}
                                target="_blank"
                              >
                                {t('patients.download')}
                              </Button>
                            ) : null,
                          ].filter(Boolean)}
                        >
                          <List.Item.Meta
                            avatar={<FileOutlined style={{ fontSize: 20, color: '#6366f1' }} />}
                            title={doc.name}
                            description={`${new Date(doc.uploadedAt).toLocaleDateString('ru-RU')} · ${(doc.size / 1024).toFixed(1)} KB`}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                      {t('patients.noDocuments')}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  );
};

const ConsentButton: React.FC<{ patientId: string; t: (key: string) => string }> = ({ patientId, t }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleConsent = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/patients/${patientId}/consent`, { consentGiven: true });
      setDone(true);
      message.success(t('patients.consentRecorded'));
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <Tag color="green" style={{ borderRadius: 20, fontWeight: 600 }}>{t('patients.consentGiven')}</Tag>;
  }

  return (
    <Button
      size="small"
      type="primary"
      loading={loading}
      onClick={handleConsent}
      style={{ borderRadius: 8, fontWeight: 600 }}
    >
      {t('patients.recordConsent')}
    </Button>
  );
};

export default PatientsPage;

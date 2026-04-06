import React, { useState, useMemo } from 'react';
import {
  Steps, Button, Select, Checkbox, DatePicker, Table, Space, Row, Col,
  Card, Empty, message, Input, Spin,
} from 'antd';
import {
  BarChartOutlined, DatabaseOutlined, TableOutlined,
  FilterOutlined, GroupOutlined, FileExcelOutlined,
  FilePdfOutlined, SaveOutlined, ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { reportsService } from '../../api/services/reports.service';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

type DataSource = 'appointments' | 'patients' | 'invoices' | 'emr_records' | 'inventory';

const dataSourceColumns: Record<DataSource, string[]> = {
  appointments: ['date', 'startTime', 'endTime', 'type', 'status', 'source', 'notes'],
  patients: ['firstName', 'lastName', 'middleName', 'dateOfBirth', 'gender', 'phone', 'email', 'address', 'bloodType'],
  invoices: ['invoiceNumber', 'totalAmount', 'discountAmount', 'finalAmount', 'status', 'paidAt'],
  emr_records: ['complaints', 'diagnosis', 'diagnosisCode', 'status', 'recommendations'],
  inventory: ['name', 'sku', 'category', 'quantity', 'minQuantity', 'unit', 'price', 'expirationDate'],
};

const groupByOptions: Record<DataSource, string[]> = {
  appointments: ['status', 'type', 'source'],
  patients: ['gender', 'bloodType'],
  invoices: ['status'],
  emr_records: ['status', 'diagnosisCode'],
  inventory: ['category', 'unit'],
};

const ReportBuilderPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [dataSource, setDataSource] = useState<DataSource | undefined>(undefined);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = useMutation({
    mutationFn: (params: any) => reportsService.getCustomReport(params),
    onSuccess: (data) => setReportData(data),
    onError: () => message.error(t('common.error')),
  });

  const steps = [
    { title: t('reportBuilder.stepDataSource'), icon: <DatabaseOutlined /> },
    { title: t('reportBuilder.stepColumns'), icon: <TableOutlined /> },
    { title: t('reportBuilder.stepFilters'), icon: <FilterOutlined /> },
    { title: t('reportBuilder.stepGrouping'), icon: <GroupOutlined /> },
    { title: t('reportBuilder.stepPreview'), icon: <BarChartOutlined /> },
  ];

  const dataSources = [
    { value: 'appointments', label: t('reportBuilder.dsAppointments'), icon: '📅' },
    { value: 'patients', label: t('reportBuilder.dsPatients'), icon: '👥' },
    { value: 'invoices', label: t('reportBuilder.dsInvoices'), icon: '💰' },
    { value: 'emr_records', label: t('reportBuilder.dsEmrRecords'), icon: '📋' },
    { value: 'inventory', label: t('reportBuilder.dsInventory'), icon: '📦' },
  ];

  const availableColumns = dataSource ? dataSourceColumns[dataSource] : [];
  const availableGroupBy = dataSource ? groupByOptions[dataSource] : [];

  const handleNext = () => {
    if (currentStep === 0 && !dataSource) {
      message.warning(t('reportBuilder.selectDataSourceRequired'));
      return;
    }
    if (currentStep === 1 && selectedColumns.length === 0) {
      message.warning(t('reportBuilder.selectColumnsRequired'));
      return;
    }
    if (currentStep === 3) {
      // Generate report
      generateReport.mutate({
        dataSource,
        columns: selectedColumns,
        filters: {
          dateFrom,
          dateTo,
          ...(doctorId ? { doctorId } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        ...(groupBy ? { groupBy } : {}),
      });
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const previewColumns = useMemo(() => {
    if (!reportData) return [];
    if (reportData.grouped) {
      return [
        { title: t('reportBuilder.group'), dataIndex: 'group', key: 'group', render: (v: string) => v || '--' },
        { title: t('reportBuilder.count'), dataIndex: 'count', key: 'count' },
        ...(reportData.data?.[0]?.totalAmount !== undefined
          ? [{ title: t('billing.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount' }]
          : []),
        ...(reportData.data?.[0]?.totalQuantity !== undefined
          ? [{ title: t('inventory.quantity'), dataIndex: 'totalQuantity', key: 'totalQuantity' }]
          : []),
      ];
    }
    return selectedColumns.map((col) => ({
      title: t(`reportBuilder.col_${col}`, col),
      dataIndex: col,
      key: col,
      render: (v: any) => {
        if (v === null || v === undefined) return '--';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      },
    }));
  }, [reportData, selectedColumns, t]);

  const exportCsv = () => {
    if (!reportData?.data?.length) return;
    const headers = previewColumns.map((c: any) => c.title).join(',');
    const rows = reportData.data.map((row: any) =>
      previewColumns.map((c: any) => {
        const val = row[c.dataIndex];
        return val !== null && val !== undefined ? `"${String(val).replace(/"/g, '""')}"` : '';
      }).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${dataSource}_${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
    message.success(t('reportBuilder.exported'));
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h2>
            <BarChartOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
            {t('reportBuilder.title')}
          </h2>
          <p className="page-header-subtitle">{t('reportBuilder.subtitle')}</p>
        </div>
      </div>

      <div className="modern-card" style={{ marginBottom: 20 }}>
        <div className="modern-card-body" style={{ padding: 24 }}>
          <Steps
            current={currentStep}
            items={steps.map((s) => ({ title: s.title, icon: s.icon }))}
            style={{ marginBottom: 32 }}
          />

          {/* Step 0: Data Source */}
          {currentStep === 0 && (
            <div>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>{t('reportBuilder.chooseDataSource')}</h3>
              <Row gutter={[16, 16]}>
                {dataSources.map((ds) => (
                  <Col xs={12} sm={8} md={6} key={ds.value}>
                    <Card
                      hoverable
                      onClick={() => {
                        setDataSource(ds.value as DataSource);
                        setSelectedColumns([]);
                        setGroupBy(undefined);
                      }}
                      style={{
                        textAlign: 'center',
                        borderColor: dataSource === ds.value ? 'var(--primary-500)' : undefined,
                        background: dataSource === ds.value ? 'var(--primary-50)' : undefined,
                      }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{ds.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{ds.label}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Step 1: Columns */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>{t('reportBuilder.selectColumns')}</h3>
              <Checkbox.Group
                value={selectedColumns}
                onChange={(vals) => setSelectedColumns(vals as string[])}
              >
                <Row gutter={[12, 12]}>
                  {availableColumns.map((col) => (
                    <Col xs={12} sm={8} md={6} key={col}>
                      <Checkbox value={col} style={{ fontSize: 14 }}>
                        {t(`reportBuilder.col_${col}`, col)}
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
              <div style={{ marginTop: 16 }}>
                <Button
                  size="small"
                  onClick={() => setSelectedColumns([...availableColumns])}
                >
                  {t('reportBuilder.selectAll')}
                </Button>
                <Button
                  size="small"
                  style={{ marginLeft: 8 }}
                  onClick={() => setSelectedColumns([])}
                >
                  {t('reportBuilder.deselectAll')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Filters */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>{t('reportBuilder.addFilters')}</h3>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>{t('reportBuilder.dateRange')}</div>
                  <RangePicker
                    value={[dayjs(dateFrom), dayjs(dateTo)]}
                    onChange={(dates) => {
                      if (dates?.[0] && dates?.[1]) {
                        setDateFrom(dates[0].format('YYYY-MM-DD'));
                        setDateTo(dates[1].format('YYYY-MM-DD'));
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </Col>
                {(dataSource === 'appointments' || dataSource === 'emr_records') && (
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>{t('scheduling.doctor')}</div>
                    <Input
                      placeholder={t('reportBuilder.doctorIdPlaceholder')}
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value || undefined)}
                    />
                  </Col>
                )}
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>{t('common.status')}</div>
                  <Input
                    placeholder={t('reportBuilder.statusPlaceholder')}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value || undefined)}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* Step 3: Grouping */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>{t('reportBuilder.chooseGrouping')}</h3>
              <Select
                placeholder={t('reportBuilder.groupByPlaceholder')}
                allowClear
                value={groupBy}
                onChange={setGroupBy}
                style={{ minWidth: 240 }}
                options={[
                  { value: undefined, label: t('reportBuilder.noGrouping') },
                  ...availableGroupBy.map((g) => ({
                    value: g,
                    label: t(`reportBuilder.col_${g}`, g),
                  })),
                ]}
              />
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, margin: 0 }}>
                  {t('reportBuilder.previewResults')}
                  {reportData?.total !== undefined && (
                    <span style={{ fontWeight: 400, color: 'var(--gray-400)', fontSize: 14, marginLeft: 8 }}>
                      ({reportData.total} {t('reportBuilder.records')})
                    </span>
                  )}
                </h3>
                <Space>
                  <Button icon={<FileExcelOutlined />} onClick={exportCsv}>
                    CSV
                  </Button>
                  <Button icon={<FilePdfOutlined />} onClick={() => message.info(t('reportBuilder.pdfComingSoon'))}>
                    PDF
                  </Button>
                </Space>
              </div>

              {generateReport.isPending && (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
              )}

              {!generateReport.isPending && reportData && (
                <Table
                  columns={previewColumns}
                  dataSource={reportData.data || []}
                  rowKey={(_, i) => String(i)}
                  scroll={{ x: 800 }}
                  size="middle"
                  pagination={{ pageSize: 50 }}
                  locale={{ emptyText: <Empty description={t('common.noData')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
              )}

              {!generateReport.isPending && !reportData && (
                <Empty description={t('reportBuilder.noPreview')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={currentStep === 4}
            >
              {currentStep === 3 ? t('reportBuilder.generate') : t('common.next')}
              {currentStep < 3 && <ArrowRightOutlined style={{ marginLeft: 4 }} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderPage;

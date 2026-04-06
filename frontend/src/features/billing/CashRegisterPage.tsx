import React, { useState } from 'react';
import { Button, Row, Col, Statistic, Tag, Modal, InputNumber, Input, Table, message, Spin, Empty, Divider, Space } from 'antd';
import {
  LockOutlined,
  UnlockOutlined,
  BankOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import {
  useCashRegister,
  useOpenCashRegister,
  useCloseCashRegister,
  useCashRegisterTransactions,
  useAddCashRegisterTransaction,
} from '../../hooks/useBilling';
import { formatCurrency, getCurrencySymbol } from '../../utils/format';
import type { CashRegisterTransaction } from '../../types';

type TransactionModalType = 'cash_in' | 'cash_out' | null;

const CashRegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: register, isLoading } = useCashRegister();
  const { data: transactions, isLoading: txLoading } = useCashRegisterTransactions(register?.id);
  const openRegister = useOpenCashRegister();
  const closeRegister = useCloseCashRegister();
  const addTransaction = useAddCashRegisterTransaction();

  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [actualAmount, setActualAmount] = useState<number | null>(null);
  const [closeComment, setCloseComment] = useState('');

  const [txModalType, setTxModalType] = useState<TransactionModalType>(null);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDescription, setTxDescription] = useState('');

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;

  const isOpen = register?.status === 'open';

  const handleOpen = async () => {
    await openRegister.mutateAsync(openingAmount);
    message.success(t('cashRegister.opened'));
    setOpenModal(false);
    setOpeningAmount(0);
  };

  const handleClose = async () => {
    await closeRegister.mutateAsync();
    message.success(t('cashRegister.closed'));
    setCloseModal(false);
    setActualAmount(null);
    setCloseComment('');
  };

  const expectedAmount = register?.closingAmount || register?.openingAmount || 0;
  const closeDifference = actualAmount !== null ? actualAmount - expectedAmount : null;

  const handleTransaction = async () => {
    if (!register || !txModalType || txAmount <= 0) return;
    await addTransaction.mutateAsync({
      registerId: register.id,
      type: txModalType,
      amount: txAmount,
      description: txDescription || undefined,
    });
    message.success(t('cashRegister.transactionSuccess'));
    setTxModalType(null);
    setTxAmount(0);
    setTxDescription('');
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    cash_in: { label: t('cashRegister.typeCashIn'), color: 'green' },
    cash_out: { label: t('cashRegister.typeCashOut'), color: 'red' },
    payment: { label: t('cashRegister.typePayment'), color: 'blue' },
    refund: { label: t('cashRegister.typeRefund'), color: 'orange' },
    encashment: { label: t('cashRegister.typeEncashment'), color: 'purple' },
  };

  const columns: ColumnsType<CashRegisterTransaction> = [
    {
      title: t('cashRegister.transactionTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (val: string) => new Date(val).toLocaleString('ru-RU'),
    },
    {
      title: t('cashRegister.transactionType'),
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (val: string) => {
        const info = typeLabels[val] || { label: val, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: t('cashRegister.transactionAmount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (val: number, record: CashRegisterTransaction) => {
        const isIncoming = record.type === 'cash_in' || record.type === 'payment';
        return (
          <span style={{ color: isIncoming ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {isIncoming ? '+' : '-'}{formatCurrency(val)}
          </span>
        );
      },
    },
    {
      title: t('cashRegister.transactionDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (val: string | null) => val || '—',
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2><BankOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} /> {t('nav.cashRegister')}</h2>
        <Space>
          {isOpen && (
            <>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setTxModalType('cash_in')}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                {t('cashRegister.cashIn')}
              </Button>
              <Button
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => setTxModalType('cash_out')}
              >
                {t('cashRegister.cashOut')}
              </Button>
            </>
          )}
          {!isOpen ? (
            <Button type="primary" icon={<UnlockOutlined />} onClick={() => setOpenModal(true)}>{t('cashRegister.openRegister')}</Button>
          ) : (
            <Button danger icon={<LockOutlined />} onClick={() => setCloseModal(true)}>{t('cashRegister.closeRegister')}</Button>
          )}
        </Space>
      </div>

      {!register ? (
        <div className="modern-card">
          <div className="modern-card-body">
            <Empty description={t('cashRegister.notOpenedHint')} />
          </div>
        </div>
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <div className="modern-card">
                <div className="modern-card-body" style={{ textAlign: 'center' }}>
                  <Statistic
                    title={t('common.status')}
                    valueRender={() => (
                      <Tag color={isOpen ? 'green' : 'red'} style={{ fontSize: 16, padding: '4px 16px' }}>
                        {isOpen ? t('cashRegister.statusOpen') : t('cashRegister.statusClosed')}
                      </Tag>
                    )}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="modern-card">
                <div className="modern-card-body" style={{ textAlign: 'center' }}>
                  <Statistic
                    title={t('cashRegister.openingAmount')}
                    value={register.openingAmount || 0}
                    suffix={getCurrencySymbol()}
                    precision={2}
                    valueStyle={{ color: 'var(--primary-500)' }}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="modern-card">
                <div className="modern-card-body" style={{ textAlign: 'center' }}>
                  <Statistic
                    title={t('cashRegister.currentAmount')}
                    value={register.closingAmount || register.openingAmount || 0}
                    suffix={getCurrencySymbol()}
                    precision={2}
                    valueStyle={{ color: '#10b981', fontWeight: 700 }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <div className="modern-card">
                <div className="modern-card-header"><h3>{t('cashRegister.info')}</h3></div>
                <div className="modern-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--gray-500)' }}>{t('cashRegister.statusOpen')}</span>
                    <span>{register.openedAt ? new Date(register.openedAt).toLocaleString('ru-RU') : '—'}</span>
                  </div>
                  {register.closedAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--gray-500)' }}>{t('cashRegister.statusClosed')}</span>
                      <span>{new Date(register.closedAt).toLocaleString('ru-RU')}</span>
                    </div>
                  )}
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--gray-500)' }}>{t('billing.cash')}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(register.cashSales || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--gray-500)' }}>{t('cashRegister.cardPayments')}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(register.cardSales || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>{t('cashRegister.transactionsCount')}</span>
                    <span style={{ fontWeight: 600 }}>{(transactions || []).length}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Transactions table */}
          <div className="modern-card">
            <div className="modern-card-header"><h3>{t('cashRegister.transactions')}</h3></div>
            <div className="modern-card-body" style={{ padding: 0 }}>
              <Table<CashRegisterTransaction>
                columns={columns}
                dataSource={transactions || []}
                rowKey="id"
                loading={txLoading}
                pagination={{ pageSize: 20, showSizeChanger: false }}
                locale={{ emptyText: t('cashRegister.noTransactions') }}
                size="middle"
              />
            </div>
          </div>
        </>
      )}

      {/* Open register modal */}
      <Modal title={t('cashRegister.openRegister')} open={openModal} onCancel={() => setOpenModal(false)}
        onOk={handleOpen} confirmLoading={openRegister.isPending} okText={t('cashRegister.open')} cancelText={t('common.cancel')}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{t('cashRegister.openingAmountLabel')}</label>
          <InputNumber value={openingAmount} onChange={(v) => setOpeningAmount(v || 0)}
            style={{ width: '100%' }} min={0} precision={2} size="large" />
        </div>
      </Modal>

      {/* Close register modal */}
      <Modal
        title={t('cashRegister.closeRegister')}
        open={closeModal}
        onCancel={() => { setCloseModal(false); setActualAmount(null); setCloseComment(''); }}
        onOk={handleClose}
        confirmLoading={closeRegister.isPending}
        okText={t('cashRegister.closeRegister')}
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: actualAmount === null || (closeDifference !== null && closeDifference !== 0 && !closeComment.trim()) }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 12 }}>
            {t('cashRegister.expectedAmount')}: <strong>{formatCurrency(expectedAmount)}</strong>
          </div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            {t('cashRegister.actualAmount')} ({getCurrencySymbol()})
          </label>
          <InputNumber
            value={actualAmount}
            onChange={(v) => setActualAmount(v)}
            style={{ width: '100%' }}
            min={0}
            precision={2}
            size="large"
          />
        </div>
        {actualAmount !== null && closeDifference !== null && (
          <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
            {closeDifference > 0 && (
              <span style={{ color: '#10b981' }}>{t('cashRegister.surplus')}: +{formatCurrency(closeDifference)}</span>
            )}
            {closeDifference < 0 && (
              <span style={{ color: '#ef4444' }}>{t('cashRegister.shortage')}: {formatCurrency(closeDifference)}</span>
            )}
            {closeDifference === 0 && (
              <span style={{ color: '#10b981' }}>{t('cashRegister.amountMatches')}</span>
            )}
          </div>
        )}
        {actualAmount !== null && closeDifference !== null && closeDifference !== 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {t('cashRegister.closeComment')} *
            </label>
            <Input.TextArea
              rows={3}
              value={closeComment}
              onChange={(e) => setCloseComment(e.target.value)}
              placeholder={t('cashRegister.closeCommentPlaceholder')}
            />
          </div>
        )}
      </Modal>

      {/* Cash-in / Cash-out modal */}
      <Modal
        title={txModalType === 'cash_in' ? t('cashRegister.cashInTitle') : t('cashRegister.cashOutTitle')}
        open={txModalType !== null}
        onCancel={() => {
          setTxModalType(null);
          setTxAmount(0);
          setTxDescription('');
        }}
        onOk={handleTransaction}
        confirmLoading={addTransaction.isPending}
        okText={txModalType === 'cash_in' ? t('cashRegister.cashIn') : t('cashRegister.cashOut')}
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: txAmount <= 0 }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            {t('cashRegister.amount')} ({getCurrencySymbol()})
          </label>
          <InputNumber
            value={txAmount}
            onChange={(v) => setTxAmount(v || 0)}
            style={{ width: '100%' }}
            min={0.01}
            precision={2}
            size="large"
            prefix={txModalType === 'cash_in' ? <ArrowDownOutlined style={{ color: '#10b981' }} /> : <ArrowUpOutlined style={{ color: '#ef4444' }} />}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            {t('cashRegister.description')}
          </label>
          <Input
            value={txDescription}
            onChange={(e) => setTxDescription(e.target.value)}
            placeholder={t('cashRegister.descriptionPlaceholder')}
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
};

export default CashRegisterPage;

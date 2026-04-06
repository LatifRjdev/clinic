import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Tag, message } from 'antd';
import { UserOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueService } from '../../../api/services/queue.service';
import { appointmentsService } from '../../../api/services/scheduling.service';
import type { Appointment } from '../../../types';

interface QueueData {
  data: Appointment[];
  total: number;
  inProgress: number;
  waiting: number;
}

const QueueWidget: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>();

  const { data: doctors } = useQuery({
    queryKey: ['scheduling', 'doctors'],
    queryFn: () => appointmentsService.getDoctors(),
  });

  const { data, isLoading } = useQuery<QueueData>({
    queryKey: ['queue', 'today'],
    queryFn: () => queueService.getQueue(),
    refetchInterval: 15000,
  });

  const callNextMutation = useMutation({
    mutationFn: () => {
      if (!selectedDoctorId) return Promise.reject(new Error('no-doctor'));
      return queueService.callNext(selectedDoctorId);
    },
    onSuccess: () => {
      message.success(t('dashboard.queueCalledNext'));
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (err: any) => {
      if (err?.message === 'no-doctor') {
        message.warning(t('dashboard.queueNoDoctor'));
      } else {
        message.error(t('dashboard.queueCallNextError'));
      }
    },
  });

  const items: Appointment[] = data?.data || [];

  const formatPatient = (a: Appointment) => {
    const p = a.patient;
    if (!p) return '—';
    return `${p.lastName} ${p.firstName}${p.middleName ? ' ' + p.middleName : ''}`;
  };

  const doctorOptions = useMemo(
    () =>
      (doctors || []).map((d) => ({
        value: d.id,
        label: `${d.lastName} ${d.firstName}`,
      })),
    [doctors],
  );

  return (
    <div className="modern-card" style={{ marginBottom: 20 }}>
      <div className="modern-card-header">
        <h3>{t('dashboard.queueTitle')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color="blue">
            {t('dashboard.queueWaiting')}: {data?.waiting ?? 0}
          </Tag>
          <Tag color="green">
            {t('dashboard.queueInProgress')}: {data?.inProgress ?? 0}
          </Tag>
        </div>
      </div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('dashboard.queueNoDoctor')}
            style={{ flex: 1 }}
            value={selectedDoctorId}
            onChange={setSelectedDoctorId}
            options={doctorOptions}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={callNextMutation.isPending}
            disabled={!selectedDoctorId}
            onClick={() => callNextMutation.mutate()}
          >
            {t('dashboard.queueCallNext')}
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {!isLoading && items.length === 0 && (
            <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 12 }}>
              {t('dashboard.queueEmpty')}
            </div>
          )}
          {items.slice(0, 8).map((a) => {
            const inProgress = a.status === 'in_progress';
            return (
              <div className="task-item" key={a.id}>
                {inProgress ? (
                  <PlayCircleOutlined style={{ color: '#10b981', fontSize: 14 }} />
                ) : (
                  <ClockCircleOutlined style={{ color: '#3b82f6', fontSize: 14 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-item-title">{formatPatient(a)}</div>
                  <div className="task-item-meta">
                    <UserOutlined style={{ marginRight: 4 }} />
                    {a.doctor ? `${a.doctor.lastName} ${a.doctor.firstName}` : '—'} · {a.startTime}
                  </div>
                </div>
                <Tag color={inProgress ? 'green' : 'blue'} style={{ marginRight: 0 }}>
                  {inProgress
                    ? t('dashboard.queueStatusInProgress')
                    : t('dashboard.queueStatusWaiting')}
                </Tag>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QueueWidget;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Tag } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { roomsService } from '../../../api/services/scheduling.service';
import { queueService } from '../../../api/services/queue.service';
import type { Appointment, Room } from '../../../types';

interface QueueData {
  data: Appointment[];
}

const RoomStatusWidget: React.FC = () => {
  const { t } = useTranslation();

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => roomsService.findAll(),
  });

  const { data: queue } = useQuery<QueueData>({
    queryKey: ['queue', 'today'],
    queryFn: () => queueService.getQueue(),
    refetchInterval: 15000,
  });

  const activeAppointments = (queue?.data || []).filter((a) => a.status === 'in_progress');

  const roomToAppointment = new Map<string, Appointment>();
  activeAppointments.forEach((a) => {
    if (a.roomId) roomToAppointment.set(a.roomId, a);
  });

  const items = (rooms || []).filter((r) => r.isActive);

  const formatPerson = (first?: string, last?: string) => {
    if (!first && !last) return '';
    return `${last || ''} ${first || ''}`.trim();
  };

  return (
    <div className="modern-card" style={{ marginBottom: 20 }}>
      <div className="modern-card-header">
        <h3>{t('dashboard.roomStatusTitle')}</h3>
      </div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.length === 0 && (
            <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 12 }}>
              {t('dashboard.roomNoRooms')}
            </div>
          )}
          {items.map((room) => {
            const apt = roomToAppointment.get(room.id);
            const occupied = !!apt;
            return (
              <div className="task-item" key={room.id}>
                <HomeOutlined
                  style={{
                    color: occupied ? '#ef4444' : '#10b981',
                    fontSize: 14,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-item-title">
                    {room.name} {room.number ? `· №${room.number}` : ''}
                  </div>
                  <div className="task-item-meta">
                    {occupied && apt ? (
                      <>
                        {formatPerson(apt.doctor?.firstName, apt.doctor?.lastName)}
                        {apt.patient ? ` → ${formatPerson(apt.patient.firstName, apt.patient.lastName)}` : ''}
                      </>
                    ) : (
                      room.floor ? `${t('dashboard.roomFree')} · ${room.floor}` : t('dashboard.roomFree')
                    )}
                  </div>
                </div>
                <Tag color={occupied ? 'red' : 'green'} style={{ marginRight: 0 }}>
                  {occupied ? t('dashboard.roomOccupied') : t('dashboard.roomFree')}
                </Tag>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoomStatusWidget;

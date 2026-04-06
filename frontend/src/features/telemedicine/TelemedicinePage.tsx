import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Modal, Tooltip, Avatar, Input,
  message, Empty,
} from 'antd';
import {
  VideoCameraOutlined, PhoneOutlined, AudioOutlined,
  AudioMutedOutlined, DesktopOutlined, MessageOutlined,
  ClockCircleOutlined, UserOutlined,
  SendOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useVideoSessions, useStartVideoSession, useEndVideoSession } from '../../hooks/useTelemedicine';
import type { VideoSession } from '../../api/services/telemedicine.service';

const TelemedicinePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [activeSession, setActiveSession] = useState<VideoSession | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: sessionsData, isLoading } = useVideoSessions({ page, limit: 20 });
  const startSession = useStartVideoSession();
  const endSession = useEndVideoSession();

  const sessions: VideoSession[] = sessionsData?.data || [];
  const total = sessionsData?.total || 0;

  // Call timer
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callActive]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartCall = async (session: VideoSession) => {
    try {
      await startSession.mutateAsync(session.id);
      setActiveSession({ ...session, status: 'active' });
      setCallActive(true);
      setCallDuration(0);
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleEndCall = async () => {
    if (!activeSession) return;
    try {
      await endSession.mutateAsync(activeSession.id);
      setCallActive(false);
      setActiveSession(null);
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
      message.success(t('telemedicine.callEnded'));
      // Prompt to create EMR record
      Modal.confirm({
        title: t('telemedicine.createEmrPrompt'),
        content: t('telemedicine.createEmrPromptDesc'),
        okText: t('emr.newRecord'),
        cancelText: t('common.close'),
        onOk: () => {
          navigate(`/emr?patientId=${activeSession.patientId}&appointmentId=${activeSession.appointmentId}`);
        },
      });
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, {
      sender: user?.lastName ? `${user.lastName} ${user.firstName}` : t('common.user'),
      text: chatInput,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatInput('');
  }, [chatInput, user, t]);

  const statusColors: Record<string, string> = {
    waiting: 'orange',
    active: 'green',
    ended: 'default',
  };

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
      render: (_: unknown, record: VideoSession) => {
        const name = record.patient
          ? `${record.patient.lastName || ''} ${record.patient.firstName || ''}`.trim()
          : record.patientId?.slice(0, 8) + '...';
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
      title: t('scheduling.doctor'),
      key: 'doctor',
      render: (_: unknown, record: VideoSession) => {
        const name = record.doctor
          ? `${record.doctor.lastName || ''} ${record.doctor.firstName || ''}`.trim()
          : record.doctorId?.slice(0, 8) + '...';
        return <span style={{ fontWeight: 500 }}>{name}</span>;
      },
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {t(`telemedicine.status_${status}`)}
        </Tag>
      ),
    },
    {
      title: t('telemedicine.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (d: number | null) => d ? formatDuration(d) : '--:--',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 140,
      render: (_: unknown, record: VideoSession) => (
        <Space>
          {record.status === 'waiting' && (
            <Tooltip title={t('telemedicine.startCall')}>
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                size="small"
                onClick={() => handleStartCall(record)}
              />
            </Tooltip>
          )}
          {record.status === 'active' && (
            <Tooltip title={t('telemedicine.joinCall')}>
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                size="small"
                style={{ background: '#10b981' }}
                onClick={() => {
                  setActiveSession(record);
                  setCallActive(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Active call view
  if (activeSession && callActive) {
    const patientName = activeSession.patient
      ? `${activeSession.patient.lastName || ''} ${activeSession.patient.firstName || ''}`.trim()
      : t('scheduling.patient');

    return (
      <div className="animate-fade-in-up" style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 16 }}>
        {/* Main video area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Video container */}
          <div style={{
            flex: 1, background: '#1a1a2e', borderRadius: 20, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {/* Patient video placeholder */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'rgba(255,255,255,0.6)',
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <UserOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{patientName}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                {t('telemedicine.videoPlaceholder')}
              </span>
            </div>

            {/* Self-view */}
            <div style={{
              position: 'absolute', bottom: 20, right: 20,
              width: 180, height: 120, borderRadius: 12,
              background: '#2d2d44', border: '2px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {videoMuted ? (
                <EyeInvisibleOutlined style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }} />
              ) : (
                <VideoCameraOutlined style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }} />
              )}
            </div>

            {/* Timer */}
            <div style={{
              position: 'absolute', top: 20, left: 20,
              background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 8, color: 'white',
            }}>
              <ClockCircleOutlined />
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatDuration(callDuration)}
              </span>
            </div>

            {/* Status indicator */}
            <div style={{
              position: 'absolute', top: 20, right: 20,
              background: '#10b981', borderRadius: 8, padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontSize: 13,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
              {t('telemedicine.connected')}
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 12, padding: '16px 0',
          }}>
            <Tooltip title={audioMuted ? t('telemedicine.unmute') : t('telemedicine.mute')}>
              <Button
                shape="circle"
                size="large"
                icon={audioMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                style={{
                  width: 56, height: 56,
                  background: audioMuted ? '#ef4444' : 'var(--gray-100)',
                  color: audioMuted ? 'white' : 'var(--gray-700)',
                  border: 'none',
                }}
                onClick={() => setAudioMuted(!audioMuted)}
              />
            </Tooltip>
            <Tooltip title={videoMuted ? t('telemedicine.enableVideo') : t('telemedicine.disableVideo')}>
              <Button
                shape="circle"
                size="large"
                icon={videoMuted ? <EyeInvisibleOutlined /> : <VideoCameraOutlined />}
                style={{
                  width: 56, height: 56,
                  background: videoMuted ? '#ef4444' : 'var(--gray-100)',
                  color: videoMuted ? 'white' : 'var(--gray-700)',
                  border: 'none',
                }}
                onClick={() => setVideoMuted(!videoMuted)}
              />
            </Tooltip>
            <Tooltip title={t('telemedicine.shareScreen')}>
              <Button
                shape="circle"
                size="large"
                icon={<DesktopOutlined />}
                style={{
                  width: 56, height: 56,
                  background: 'var(--gray-100)', color: 'var(--gray-700)', border: 'none',
                }}
              />
            </Tooltip>
            <Tooltip title={t('telemedicine.chat')}>
              <Button
                shape="circle"
                size="large"
                icon={<MessageOutlined />}
                style={{
                  width: 56, height: 56,
                  background: chatOpen ? 'var(--primary-500)' : 'var(--gray-100)',
                  color: chatOpen ? 'white' : 'var(--gray-700)',
                  border: 'none',
                }}
                onClick={() => setChatOpen(!chatOpen)}
              />
            </Tooltip>
            <Tooltip title={t('telemedicine.endCall')}>
              <Button
                shape="circle"
                size="large"
                icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
                style={{
                  width: 56, height: 56,
                  background: '#ef4444', color: 'white', border: 'none',
                }}
                onClick={handleEndCall}
              />
            </Tooltip>
          </div>
        </div>

        {/* Sidebar: Patient info + Chat */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Patient info */}
          <div className="modern-card" style={{ flexShrink: 0 }}>
            <div className="modern-card-body" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar size={44} style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                  {patientName.charAt(0)}
                </Avatar>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{patientName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {t('telemedicine.onlineConsultation')}
                  </div>
                </div>
              </div>
              {activeSession.appointment && (
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  <div>{t('scheduling.date')}: {new Date(activeSession.appointment.date).toLocaleDateString('ru-RU')}</div>
                  <div>{t('scheduling.time')}: {activeSession.appointment.startTime} - {activeSession.appointment.endTime}</div>
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          {chatOpen && (
            <div className="modern-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="modern-card-body" style={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 14 }}>
                  {t('telemedicine.chat')}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chatMessages.length === 0 && (
                    <Empty description={t('telemedicine.noMessages')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                      background: 'var(--primary-50)', borderRadius: 10, padding: '8px 12px',
                      maxWidth: '85%', alignSelf: 'flex-end',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary-600)', marginBottom: 2 }}>
                        {msg.sender}
                      </div>
                      <div style={{ fontSize: 13 }}>{msg.text}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)', textAlign: 'right', marginTop: 2 }}>
                        {msg.time}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 8 }}>
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onPressEnter={handleSendChat}
                    placeholder={t('chat.typeMessage')}
                    size="small"
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    size="small"
                    onClick={handleSendChat}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h2>
            <VideoCameraOutlined style={{ marginRight: 10, color: 'var(--primary-500)' }} />
            {t('telemedicine.title')}
          </h2>
          <p className="page-header-subtitle">{t('telemedicine.subtitle', { count: total })}</p>
        </div>
      </div>

      <div className="modern-card">
        <div className="modern-card-body">
          <Table
            columns={columns}
            dataSource={sessions}
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
            locale={{ emptyText: <Empty description={t('telemedicine.noSessions')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          />
        </div>
      </div>
    </div>
  );
};

export default TelemedicinePage;

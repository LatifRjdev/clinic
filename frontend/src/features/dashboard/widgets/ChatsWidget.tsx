import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const activeChats = [
  { nameKey: 'roles.reception', avatar: 'Р', messageKey: 'chat.newPatientWaiting', timeKey: 'chat.minutesAgo', timeVal: 2, color: '#a855f7' },
  { nameKey: 'dashboard.laboratory', avatar: 'Л', messageKey: 'chat.resultsReady', timeKey: 'chat.minutesAgo', timeVal: 15, color: '#10b981' },
];

const ChatsWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="modern-card">
      <div className="modern-card-header">
        <h3>{t('dashboard.activeChats')}</h3>
        <MessageOutlined
          style={{ color: 'var(--gray-400)', fontSize: 16, cursor: 'pointer' }}
          onClick={() => navigate('/chat')}
        />
      </div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {activeChats.map((chat, index) => (
            <div
              className="chat-item"
              key={index}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/chat')}
            >
              <div
                className="chat-item-avatar"
                style={{ background: `linear-gradient(135deg, ${chat.color}, ${chat.color}dd)`, color: 'white' }}
              >
                {chat.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="chat-item-name">{t(chat.nameKey)}</span>
                  <span className="chat-item-time">{chat.timeVal} {t('chat.minutesAgo')}</span>
                </div>
                <div className="chat-item-message">{t(chat.messageKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatsWidget;

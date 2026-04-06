import React from 'react';
import { useTranslation } from 'react-i18next';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../../hooks';
import { useAuthStore } from '../../../store/authStore';
import type { Task } from '../../../types';

interface TasksWidgetProps {
  onlyMine?: boolean;
  title?: string;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ onlyMine = false, title }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const params = onlyMine && user ? { assigneeId: user.id, limit: 5 } : { limit: 5 };
  const { data } = useTasks(params);

  const displayTitle = title ?? t('dashboard.urgentTasks');

  const tasks: Task[] = Array.isArray(data) ? data : data?.data || [];
  const activeTasks = tasks.filter((t: Task) => t.status !== 'completed' && t.status !== 'cancelled');

  return (
    <div className="modern-card" style={{ marginBottom: 20 }}>
      <div className="modern-card-header">
        <h3>{displayTitle}</h3>
        <span
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--primary-600)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
          onClick={() => navigate('/tasks')}
        >
          {t('dashboard.allTasks')} <RightOutlined style={{ fontSize: 10 }} />
        </span>
      </div>
      <div className="modern-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {activeTasks.length === 0 && (
            <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 12 }}>{t('dashboard.noActiveTasks')}</div>
          )}
          {activeTasks.slice(0, 5).map((task) => {
            const priorityKeyMap: Record<string, string> = {
              urgent: 'tasks.urgent',
              high: 'tasks.high',
              normal: 'tasks.normal',
              low: 'tasks.low',
            };
            return (
              <div className="task-item" key={task.id}>
                <span className={`task-item-dot ${task.priority}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-item-title">{task.title}</div>
                  <div className="task-item-meta">{t(priorityKeyMap[task.priority] || task.priority)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TasksWidget;

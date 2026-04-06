import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Segmented,
  Avatar,
  message,
  Drawer,
  Popconfirm,
  Tooltip,
  Switch,
  List,
  Typography,
  Divider,
  Tag,
  Dropdown,
  Badge,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  StopOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useChangeTaskStatus,
  useTaskComments,
  useAddTaskComment,
} from '../../hooks/useTasks';
import { useSystemUsers } from '../../hooks/useSystem';
import { useAuthStore } from '../../store/authStore';
import type { Task, TaskComment, User } from '../../types';

const { Text } = Typography;

const priorityDotColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  normal: '#3b82f6',
  low: '#9ca3af',
};

const statusClassMapTasks: Record<string, string> = {
  new: 'scheduled',
  in_progress: 'in-progress',
  review: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
};

/* ───── Next-status transition map ───── */
const nextStatusMap: Record<string, string[]> = {
  new: ['in_progress'],
  in_progress: ['review'],
  review: ['completed'],
  completed: [],
  cancelled: [],
};

/* ───── Comment list sub-component ───── */
const TaskComments: React.FC<{ taskId: string; allUsers: User[] }> = ({ taskId, allUsers }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: comments = [], isLoading } = useTaskComments(taskId);
  const addComment = useAddTaskComment();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = async () => {
    if (!commentText.trim() || !user?.id) return;
    try {
      await addComment.mutateAsync({ taskId, content: commentText.trim(), authorId: user.id });
      setCommentText('');
      message.success(t('tasks.commentAdded'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const getAuthorName = (authorId: string) => {
    const u = allUsers.find((s) => s.id === authorId);
    return u ? `${u.lastName} ${u.firstName}` : authorId.slice(0, 8);
  };

  return (
    <div>
      <Divider />
      <Text strong style={{ fontSize: 15 }}>
        <CommentOutlined style={{ marginRight: 6 }} />
        {t('tasks.comments')}
      </Text>

      <List
        loading={isLoading}
        dataSource={comments as TaskComment[]}
        locale={{ emptyText: t('tasks.noComments') }}
        style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto' }}
        renderItem={(item: TaskComment) => (
          <List.Item style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <List.Item.Meta
              avatar={
                <Avatar size={28} icon={<UserOutlined />} style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }} />
              }
              title={
                <Space>
                  <Text strong style={{ fontSize: 13 }}>{getAuthorName(item.authorId)}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(item.createdAt).toLocaleString('ru-RU')}
                  </Text>
                </Space>
              }
              description={<Text style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{item.content}</Text>}
            />
          </List.Item>
        )}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Input.TextArea
          rows={2}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t('tasks.writeComment')}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={addComment.isPending}
          onClick={handleAddComment}
          disabled={!commentText.trim()}
          style={{ alignSelf: 'flex-end' }}
        >
          {t('tasks.send')}
        </Button>
      </div>
    </div>
  );
};

/* ───── Main page ───── */
const TasksPage: React.FC = () => {
  const { t } = useTranslation();

  const taskStatusLabels: Record<string, string> = {
    new: t('tasks.new'),
    in_progress: t('tasks.inProgress'),
    review: t('tasks.review'),
    completed: t('tasks.completed'),
    cancelled: t('tasks.cancelled'),
  };

  const statusActionLabels: Record<string, string> = {
    in_progress: t('tasks.toInProgress'),
    review: t('tasks.toReview'),
    completed: t('tasks.toCompleted'),
    cancelled: t('tasks.toCancel'),
  };

  const statusActionIcons: Record<string, React.ReactNode> = {
    in_progress: <PlayCircleOutlined />,
    review: <EyeOutlined />,
    completed: <CheckCircleOutlined />,
    cancelled: <StopOutlined />,
  };

  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [assigneeFilter, setAssigneeFilter] = useState<string | undefined>(undefined);
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Determine assigneeId for query
  const effectiveAssigneeId = myTasksOnly ? user?.id : assigneeFilter;

  const queryStatus = statusFilter === 'all' ? undefined : statusFilter;
  const { data: tasksData, isLoading } = useTasks({
    status: queryStatus,
    priority: priorityFilter,
    assigneeId: effectiveAssigneeId,
  });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const changeStatus = useChangeTaskStatus();

  const { data: usersData } = useSystemUsers({ limit: 200 });
  const allUsers: User[] = usersData?.data || [];
  const staffOptions = allUsers.map((u) => ({
    value: u.id,
    label: `${u.lastName} ${u.firstName} (${u.role})`,
  }));

  const tasks = tasksData?.data || [];
  const total = tasksData?.total || 0;

  const overdueCount = tasks.filter(
    (tk) => tk.dueDate && dayjs(tk.dueDate).startOf('day').isBefore(dayjs().startOf('day')) && tk.status !== 'completed' && tk.status !== 'cancelled',
  ).length;

  const stats = {
    total,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  /* ── Create ── */
  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      const dueDate = values.dueDate
        ? (values.dueDate as { format: (f: string) => string }).format('YYYY-MM-DD')
        : undefined;
      await createTask.mutateAsync({ ...values, dueDate, createdById: user?.id } as Partial<Task>);
      message.success(t('common.success'));
      setIsCreateModalOpen(false);
      createForm.resetFields();
    } catch {
      message.error(t('common.error'));
    }
  };

  /* ── Edit ── */
  const openEdit = (record: Task) => {
    setEditingTask(record);
    editForm.setFieldsValue({
      title: record.title,
      description: record.description,
      priority: record.priority,
      assigneeId: record.assigneeId,
      dueDate: record.dueDate ? dayjs(record.dueDate) : null,
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingTask) return;
    try {
      const dueDate = values.dueDate
        ? (values.dueDate as { format: (f: string) => string }).format('YYYY-MM-DD')
        : undefined;
      await updateTask.mutateAsync({
        id: editingTask.id,
        data: { ...values, dueDate } as Partial<Task>,
      });
      message.success(t('tasks.taskUpdated'));
      setIsEditModalOpen(false);
      setEditingTask(null);
      editForm.resetFields();
    } catch {
      message.error(t('common.error'));
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      message.success(t('tasks.deleteSuccess'));
    } catch {
      message.error(t('common.error'));
    }
  };

  /* ── Status change ── */
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await changeStatus.mutateAsync({ id, status: newStatus });
      message.success(t('tasks.statusChanged'));
      // If drawer is open for this task, refresh it
      if (drawerTask?.id === id) {
        setDrawerTask((prev) => (prev ? { ...prev, status: newStatus as Task['status'] } : null));
      }
    } catch {
      message.error(t('common.error'));
    }
  };

  /* ── Drawer ── */
  const openDrawer = (record: Task) => {
    setDrawerTask(record);
  };

  /* ── Helper: get user name ── */
  const getUserName = (id?: string) => {
    if (!id) return '—';
    const u = allUsers.find((s) => s.id === id);
    return u ? `${u.lastName} ${u.firstName}` : id.slice(0, 8);
  };

  /* ── Build status action dropdown items ── */
  const getStatusActions = (record: Task): MenuProps['items'] => {
    const nextStatuses = nextStatusMap[record.status] || [];
    const items: MenuProps['items'] = nextStatuses.map((s) => ({
      key: s,
      icon: statusActionIcons[s],
      label: statusActionLabels[s],
      onClick: () => handleStatusChange(record.id, s),
    }));

    // Allow cancel from any non-terminal status
    if (record.status !== 'completed' && record.status !== 'cancelled') {
      if (items && items.length > 0) {
        items.push({ type: 'divider' as const });
      }
      (items || []).push({
        key: 'cancelled',
        icon: <StopOutlined />,
        label: statusActionLabels['cancelled'],
        danger: true,
        onClick: () => handleStatusChange(record.id, 'cancelled'),
      });
    }

    return items;
  };

  /* ── Table columns ── */
  const columns = [
    {
      title: t('tasks.title'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Task) => (
        <div style={{ cursor: 'pointer' }} onClick={() => openDrawer(record)}>
          <div style={{ fontWeight: 600, color: 'var(--primary-600)', fontSize: 14 }}>{title}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('tasks.assignee'),
      dataIndex: 'assigneeId',
      key: 'assigneeId',
      width: 180,
      render: (id: string) => {
        const name = getUserName(id);
        return (
          <Space>
            <Avatar
              size={28}
              icon={<UserOutlined />}
              style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', fontSize: 12 }}
            />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: t('tasks.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: string) => (
        <Space size={6}>
          <span
            style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: priorityDotColors[priority] || 'var(--gray-400)',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)' }}>
            {t(`tasks.${priority}`)}
          </span>
        </Space>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <span className={`status-badge ${statusClassMapTasks[status] || ''}`}>
          {taskStatusLabels[status] || status}
        </span>
      ),
    },
    {
      title: t('tasks.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 160,
      defaultSortOrder: 'ascend' as const,
      sorter: (a: Task, b: Task) => {
        const isTerminalA = a.status === 'completed' || a.status === 'cancelled';
        const isTerminalB = b.status === 'completed' || b.status === 'cancelled';
        if (isTerminalA !== isTerminalB) return isTerminalA ? 1 : -1;
        const daysA = a.dueDate ? dayjs(a.dueDate).diff(dayjs(), 'day') : 9999;
        const daysB = b.dueDate ? dayjs(b.dueDate).diff(dayjs(), 'day') : 9999;
        return daysA - daysB;
      },
      render: (date: string, record: Task) => {
        if (!date) return <span style={{ color: 'var(--gray-300)' }}>--</span>;
        const isTerminal = record.status === 'completed' || record.status === 'cancelled';
        if (isTerminal) {
          return (
            <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>
              {dayjs(date).format('DD.MM.YYYY')}
            </span>
          );
        }
        const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
        if (days < 0) {
          return <Tag color="red">{t('tasks.overdueDays', { days: Math.abs(days) })}</Tag>;
        }
        if (days <= 3) {
          return <Tag color="orange">{t('tasks.daysLeft', { days })}</Tag>;
        }
        return <Tag color="green">{t('tasks.daysLeft', { days })}</Tag>;
      },
    },
    {
      title: t('tasks.actions'),
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Task) => {
        const statusItems = getStatusActions(record);
        return (
          <Space size={4}>
            {statusItems && statusItems.length > 0 && (
              <Dropdown menu={{ items: statusItems }} trigger={['click']}>
                <Tooltip title={t('common.status')}>
                  <Button type="text" size="small" icon={<MoreOutlined />} />
                </Tooltip>
              </Dropdown>
            )}
            <Tooltip title={t('tasks.editTask')}>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
            </Tooltip>
            <Popconfirm
              title={t('tasks.confirmDelete')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Tooltip title={t('common.delete')}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  /* ── Task form fields (shared between create & edit) ── */
  const renderTaskFormFields = () => (
    <>
      <Form.Item name="title" label={t('tasks.taskName')} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label={t('tasks.description')}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="assigneeId" label={t('tasks.assignee')}>
            <Select
              placeholder={t('tasks.assignee')}
              showSearch
              optionFilterProp="label"
              options={staffOptions}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="priority" label={t('tasks.priority')} initialValue="normal">
            <Select
              options={[
                { value: 'low', label: t('tasks.low') },
                { value: 'normal', label: t('tasks.normal') },
                { value: 'high', label: t('tasks.high') },
                { value: 'urgent', label: t('tasks.urgent') },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="dueDate" label={t('tasks.dueDate')}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    </>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h2>
          <Badge count={overdueCount} offset={[12, 0]} style={{ backgroundColor: '#ef4444' }}>
            {t('tasks.title')}
          </Badge>
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
          {t('tasks.newTask')}
        </Button>
      </div>

      {/* Stat cards */}
      <Row gutter={16} style={{ marginBottom: 24 }} className="stagger-children">
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <div className="stat-card-icon blue"><UnorderedListOutlined /></div>
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">{t('common.total')}</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <div className="stat-card-icon amber"><ClockCircleOutlined /></div>
            <div className="stat-card-value">{stats.inProgress}</div>
            <div className="stat-card-label">{t('tasks.inProgress')}</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <div className="stat-card-icon green"><CheckCircleOutlined /></div>
            <div className="stat-card-value">{stats.completed}</div>
            <div className="stat-card-label">{t('tasks.completed')}</div>
          </div>
        </Col>
      </Row>

      <div className="modern-card">
        <div className="modern-card-body">
          {/* Filters row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <Segmented
              options={[
                { value: 'all', label: `${t('tasks.all')} (${total})` },
                { value: 'new', label: t('tasks.new') },
                { value: 'in_progress', label: t('tasks.inProgress') },
                { value: 'review', label: t('tasks.review') },
                { value: 'completed', label: t('tasks.completed') },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as string)}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <Space size={4}>
                <Switch
                  size="small"
                  checked={myTasksOnly}
                  onChange={(checked) => {
                    setMyTasksOnly(checked);
                    if (checked) setAssigneeFilter(undefined);
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)' }}>
                  {t('tasks.myTasks')}
                </span>
              </Space>

              <Select
                placeholder={t('tasks.priority')}
                allowClear
                style={{ minWidth: 120, flex: '1 1 120px', maxWidth: 160 }}
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                options={[
                  { value: 'low', label: t('tasks.low') },
                  { value: 'normal', label: t('tasks.normal') },
                  { value: 'high', label: t('tasks.high') },
                  { value: 'urgent', label: t('tasks.urgent') },
                ]}
              />

              <Select
                placeholder={t('tasks.assignee')}
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ minWidth: 160, flex: '1 1 160px', maxWidth: 240 }}
                value={myTasksOnly ? undefined : assigneeFilter}
                onChange={(val) => setAssigneeFilter(val)}
                disabled={myTasksOnly}
                options={staffOptions}
              />
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            size="middle"
            scroll={{ x: 900 }}
          />
        </div>
      </div>

      {/* Create modal */}
      <Modal
        title={t('tasks.newTask')}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createTask.isPending}
        width={560}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          {renderTaskFormFields()}
        </Form>
      </Modal>

      {/* Edit modal */}
      <Modal
        title={t('tasks.editTask')}
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updateTask.isPending}
        width={560}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          {renderTaskFormFields()}
        </Form>
      </Modal>

      {/* Detail drawer */}
      <Drawer
        title={t('tasks.taskDetails')}
        open={!!drawerTask}
        onClose={() => setDrawerTask(null)}
        width={Math.min(520, window.innerWidth - 24)}
      >
        {drawerTask && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{drawerTask.title}</h3>
            {drawerTask.description && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                {drawerTask.description}
              </Text>
            )}

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 12]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('common.status')}</Text>
                <div>
                  <span className={`status-badge ${statusClassMapTasks[drawerTask.status] || ''}`}>
                    {taskStatusLabels[drawerTask.status] || drawerTask.status}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('tasks.priority')}</Text>
                <div>
                  <Tag color={priorityDotColors[drawerTask.priority]}>
                    {t(`tasks.${drawerTask.priority}`)}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('tasks.assignee')}</Text>
                <div>
                  <Space>
                    <Avatar size={20} icon={<UserOutlined />} style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }} />
                    <Text style={{ fontSize: 13 }}>{getUserName(drawerTask.assigneeId)}</Text>
                  </Space>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('tasks.createdBy')}</Text>
                <div>
                  <Text style={{ fontSize: 13 }}>{getUserName(drawerTask.createdById)}</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('tasks.dueDate')}</Text>
                <div>
                  <Text style={{ fontSize: 13 }}>
                    {drawerTask.dueDate ? new Date(drawerTask.dueDate).toLocaleDateString('ru-RU') : '—'}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('tasks.createdAt')}</Text>
                <div>
                  <Text style={{ fontSize: 13 }}>
                    {new Date(drawerTask.createdAt).toLocaleString('ru-RU')}
                  </Text>
                </div>
              </Col>
              {drawerTask.completedAt && (
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('tasks.completedAt')}</Text>
                  <div>
                    <Text style={{ fontSize: 13 }}>
                      {new Date(drawerTask.completedAt).toLocaleString('ru-RU')}
                    </Text>
                  </div>
                </Col>
              )}
            </Row>

            {/* Status change buttons in drawer */}
            {(drawerTask.status !== 'completed' && drawerTask.status !== 'cancelled') && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Space wrap>
                  {(nextStatusMap[drawerTask.status] || []).map((s) => (
                    <Button
                      key={s}
                      type="primary"
                      size="small"
                      icon={statusActionIcons[s]}
                      loading={changeStatus.isPending}
                      onClick={() => handleStatusChange(drawerTask.id, s)}
                    >
                      {statusActionLabels[s]}
                    </Button>
                  ))}
                  <Button
                    size="small"
                    danger
                    icon={<StopOutlined />}
                    loading={changeStatus.isPending}
                    onClick={() => handleStatusChange(drawerTask.id, 'cancelled')}
                  >
                    {statusActionLabels['cancelled']}
                  </Button>
                </Space>
              </>
            )}

            {/* Comments */}
            <TaskComments taskId={drawerTask.id} allUsers={allUsers} />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TasksPage;

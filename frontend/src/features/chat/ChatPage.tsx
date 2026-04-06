import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, Badge, Avatar, Tooltip, Empty, Spin, Modal, Form, Select, message } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  PaperClipOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
  CheckOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { chatService } from '../../api/services/chat.service';
import { useAuthStore } from '../../store/authStore';
import { useSystemUsers } from '../../hooks/useSystem';
import type { ChatRoom, ChatMessage } from '../../types';
import { io, Socket } from 'socket.io-client';

// --- Helpers ---

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return pathname.split('.').pop()?.toLowerCase() || '';
  } catch {
    return url.split('.').pop()?.toLowerCase() || '';
  }
}

function isImageFile(url: string): boolean {
  return IMAGE_EXTENSIONS.includes(getFileExtension(url));
}

function getFileIcon(url: string) {
  const ext = getFileExtension(url);
  if (IMAGE_EXTENSIONS.includes(ext)) return <FileImageOutlined />;
  if (ext === 'pdf') return <FilePdfOutlined />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileExcelOutlined />;
  if (['doc', 'docx'].includes(ext)) return <FileWordOutlined />;
  return <FileOutlined />;
}

function getFileName(url: string): string {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split('/').pop() || url);
  } catch {
    return url.split('/').pop() || url;
  }
}

// --- Component ---

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [lastMessages, setLastMessages] = useState<Map<string, ChatMessage>>(new Map());
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRoomRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createForm] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showContacts, setShowContacts] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: usersData } = useSystemUsers({ limit: 200 });
  const allUsers = usersData?.data || [];

  // Build user name map for display
  const userNameMap = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const map = new Map<string, string>();
    allUsers.forEach((u: any) => {
      map.set(u.id, `${u.lastName || ''} ${u.firstName || ''}`.trim());
    });
    userNameMap.current = map;
  }, [allUsers]);

  const getUserName = useCallback((userId: string) => {
    return userNameMap.current.get(userId) || userId.slice(0, 8);
  }, []);

  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await chatService.getRooms(user.id);
      const roomList = Array.isArray(data) ? data : [];
      setRooms(roomList);

      // Load last message + unread count per room
      const newLastMessages = new Map<string, ChatMessage>();
      const newUnreadCounts = new Map<string, number>();

      await Promise.all(
        roomList.map(async (room) => {
          try {
            const result = await chatService.getMessages(room.id, { page: 1, limit: 1 });
            const msgs = Array.isArray(result) ? result : result?.data || [];
            if (msgs.length > 0) {
              newLastMessages.set(room.id, msgs[0]);
            }
            // Count unread: get recent messages and count unread not from me
            const recentResult = await chatService.getMessages(room.id, { page: 1, limit: 50 });
            const recentMsgs = Array.isArray(recentResult) ? recentResult : recentResult?.data || [];
            const unread = recentMsgs.filter(
              (m: ChatMessage) => !m.isRead && m.senderId !== user?.id,
            ).length;
            newUnreadCounts.set(room.id, unread);
          } catch {
            // ignore per-room errors
          }
        }),
      );

      setLastMessages(newLastMessages);
      setUnreadCounts(newUnreadCounts);
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [user?.id]);

  // Load messages for selected room
  const loadMessages = useCallback(
    async (roomId: string) => {
      setLoadingMessages(true);
      try {
        const data = await chatService.getMessages(roomId);
        const msgs = Array.isArray(data) ? data : data?.data || [];
        setMessages(msgs);

        // Mark all as read
        if (user?.id) {
          await chatService.markAllAsRead(roomId, user.id);
          setUnreadCounts((prev) => {
            const next = new Map(prev);
            next.set(roomId, 0);
            return next;
          });
        }

        // Track read status for sent messages
        const readSet = new Set<string>();
        msgs.forEach((m: ChatMessage) => {
          if (m.isRead) readSet.add(m.id);
        });
        setReadMessages(readSet);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [user?.id],
  );

  // Emit messageRead for unread messages when opening a room
  const emitMessageRead = useCallback(
    (msgs: ChatMessage[], roomId: string) => {
      if (!socketRef.current || !user?.id) return;
      msgs.forEach((msg) => {
        if (!msg.isRead && msg.senderId !== user.id && !msg.id.startsWith('temp-')) {
          socketRef.current?.emit('messageRead', {
            messageId: msg.id,
            chatRoomId: roomId,
            userId: user.id,
          });
        }
      });
    },
    [user?.id],
  );

  // Connect WebSocket
  useEffect(() => {
    loadRooms();

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const wsUrl = apiUrl.replace('/api', '') || window.location.origin;

    const token = localStorage.getItem('accessToken');
    const socket = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 50,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      console.log('[Chat] WebSocket connected');
      // Request current online users list
      socket.emit('getOnlineUsers');
    });

    socket.on('onlineUsersList', ({ users }: { users: string[] }) => {
      setOnlineUsers(new Set(users));
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Chat] WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Chat] WebSocket connection error:', err.message);
    });

    // Online / Offline
    socket.on('userOnline', ({ userId: onlineUserId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(onlineUserId));
    });

    socket.on('userOffline', ({ userId: offlineUserId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(offlineUserId);
        return next;
      });
    });

    // New message
    socket.on('newMessage', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (msg.chatRoomId !== selectedRoomRef.current) return prev;
        const withoutOptimistic = prev.filter(
          (m) =>
            !(
              m.id.startsWith('temp-') &&
              m.senderId === msg.senderId &&
              m.content === msg.content
            ),
        );
        if (withoutOptimistic.some((m) => m.id === msg.id)) return withoutOptimistic;
        return [...withoutOptimistic, msg];
      });

      // Update last message
      setLastMessages((prev) => {
        const next = new Map(prev);
        next.set(msg.chatRoomId, msg);
        return next;
      });

      // Increment unread if not current room and not mine
      if (msg.chatRoomId !== selectedRoomRef.current && msg.senderId !== user?.id) {
        setUnreadCounts((prev) => {
          const next = new Map(prev);
          next.set(msg.chatRoomId, (prev.get(msg.chatRoomId) || 0) + 1);
          return next;
        });
      }

      // If message is in current room and from someone else, mark as read
      if (msg.chatRoomId === selectedRoomRef.current && msg.senderId !== user?.id) {
        socket.emit('messageRead', {
          messageId: msg.id,
          chatRoomId: msg.chatRoomId,
          userId: user?.id,
        });
      }
    });

    // Message read receipts
    socket.on(
      'messageRead',
      ({ messageId }: { messageId: string; userId: string }) => {
        setReadMessages((prev) => new Set(prev).add(messageId));
      },
    );

    // Typing indicators
    socket.on(
      'userTyping',
      ({ userId: typingUserId, chatRoomId }: { userId: string; chatRoomId: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(typingUserId, chatRoomId);
          return next;
        });
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (next.get(typingUserId) === chatRoomId) next.delete(typingUserId);
            return next;
          });
        }, 3000);
      },
    );

    socket.on(
      'userStoppedTyping',
      ({ userId: typingUserId }: { userId: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(typingUserId);
          return next;
        });
      },
    );

    socket.io.on('reconnect', () => {
      console.log('[Chat] Reconnected');
      if (selectedRoomRef.current) {
        socket.emit('joinRoom', { chatRoomId: selectedRoomRef.current });
        loadMessages(selectedRoomRef.current);
      }
      loadRooms();
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // Keep ref in sync for socket listener closure
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Join room on selection
  useEffect(() => {
    if (selectedRoom && socketRef.current) {
      socketRef.current.emit('joinRoom', { chatRoomId: selectedRoom });
      loadMessages(selectedRoom);
    }
    return () => {
      if (selectedRoom && socketRef.current) {
        socketRef.current.emit('leaveRoom', { chatRoomId: selectedRoom });
      }
    };
  }, [selectedRoom, loadMessages]);

  // Emit read events when messages load
  useEffect(() => {
    if (selectedRoom && messages.length > 0) {
      emitMessageRead(messages, selectedRoom);
    }
  }, [messages, selectedRoom, emitMessageRead]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRoom || !socketRef.current) return;

    const content = messageText.trim();

    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatRoomId: selectedRoom,
      senderId: user?.id || '',
      content,
      type: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    socketRef.current.emit('sendMessage', {
      chatRoomId: selectedRoom,
      senderId: user?.id,
      content,
      type: 'text',
    });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current.emit('stopTyping', {
      chatRoomId: selectedRoom,
      userId: user?.id,
    });
    setMessageText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom || !socketRef.current) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    setUploading(true);
    try {
      const result = await chatService.uploadFile(file, 'chat');
      const fileUrl = result.url || result.key;

      // Optimistic file message
      const optimisticMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        chatRoomId: selectedRoom,
        senderId: user?.id || '',
        content: file.name,
        type: 'file',
        fileUrl,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      socketRef.current.emit('sendMessage', {
        chatRoomId: selectedRoom,
        senderId: user?.id,
        content: file.name,
        type: 'file',
        fileUrl,
      });
    } catch {
      message.error(t('chat.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    if (!selectedRoom || !socketRef.current) return;
    socketRef.current.emit('typing', {
      chatRoomId: selectedRoom,
      userId: user?.id,
    });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', {
        chatRoomId: selectedRoom,
        userId: user?.id,
      });
    }, 2000);
  };

  const handleCreateRoom = async (values: {
    name?: string;
    type: string;
    participantIds: string[];
  }) => {
    try {
      const memberIds = [...(values.participantIds || [])];
      if (user?.id && !memberIds.includes(user.id)) {
        memberIds.push(user.id);
      }
      const room = await chatService.createRoom({
        name: values.name,
        type: values.type,
        memberIds,
      });
      message.success(t('chat.chatCreated'));
      setCreateModalOpen(false);
      createForm.resetFields();
      await loadRooms();
      setSelectedRoom(room.id);
    } catch {
      message.error(t('chat.chatError'));
    }
  };

  const filteredRooms = rooms.filter((r) =>
    (r.name || '').toLowerCase().includes(searchText.toLowerCase()),
  );

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);

  // Get typing users for current room (excluding self)
  const currentTypingUsers = Array.from(typingUsers.entries())
    .filter(([uid, roomId]) => roomId === selectedRoom && uid !== user?.id)
    .map(([uid]) => getUserName(uid));

  // Get the other participant's ID for direct chats
  const getOtherParticipantId = (room: ChatRoom): string | null => {
    if (room.type !== 'direct' || !room.participantIds) return null;
    return room.participantIds.find((id) => id !== user?.id) || null;
  };

  // --- File message renderer ---
  const renderFileMessage = (msg: ChatMessage, isMine: boolean) => {
    const url = msg.fileUrl || '';
    if (isImageFile(url)) {
      return (
        <div>
          <img
            src={url}
            alt={msg.content}
            style={{
              maxWidth: '100%',
              maxHeight: 200,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'block',
            }}
            onClick={() => window.open(url, '_blank')}
          />
          <div
            style={{
              fontSize: 12,
              marginTop: 4,
              opacity: 0.8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: isMine ? '#fff' : 'var(--primary-600)',
          textDecoration: 'none',
        }}
      >
        <span style={{ fontSize: 24 }}>{getFileIcon(url)}</span>
        <span
          style={{
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {msg.content || getFileName(url)}
        </span>
      </a>
    );
  };

  // --- Read receipt indicator ---
  const renderReadReceipt = (msg: ChatMessage) => {
    if (msg.senderId !== user?.id) return null;
    const isTemp = msg.id.startsWith('temp-');
    const isRead = readMessages.has(msg.id) || msg.isRead;

    if (isTemp) {
      return (
        <LoadingOutlined
          style={{ fontSize: 11, marginLeft: 4, opacity: 0.6 }}
        />
      );
    }

    return (
      <span style={{ marginLeft: 4, display: 'inline-flex', opacity: isRead ? 1 : 0.5 }}>
        <CheckOutlined
          style={{
            fontSize: 10,
            color: isRead ? '#52c41a' : 'currentColor',
          }}
        />
        <CheckOutlined
          style={{
            fontSize: 10,
            marginLeft: -4,
            color: isRead ? '#52c41a' : 'currentColor',
          }}
        />
      </span>
    );
  };

  return (
    <div className="animate-fade-in-up" style={{ height: 'calc(100vh - 160px)' }}>
      <div
        className="modern-card"
        style={{ height: '100%', display: 'flex', overflow: 'hidden' }}
      >
        {/* Left Panel - Contacts */}
        {(!isMobile || showContacts) && (
          <div
            style={{
              width: isMobile ? '100%' : 340,
              minWidth: isMobile ? 0 : 340,
              borderRight: isMobile ? 'none' : '1px solid var(--gray-100)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--gray-25)',
            }}
          >
            <div
              style={{
                padding: '16px 16px 12px',
                borderBottom: '1px solid var(--gray-100)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <Input
                prefix={<SearchOutlined style={{ color: 'var(--gray-400)' }} />}
                placeholder={t('common.search')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ borderRadius: 'var(--radius-md)' }}
              />
              <Tooltip title={t('chat.newChat')}>
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  shape="circle"
                  size="small"
                  onClick={() => setCreateModalOpen(true)}
                />
              </Tooltip>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
              {loadingRooms ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : filteredRooms.length === 0 ? (
                <Empty description={t('common.noData')} style={{ padding: 40 }} />
              ) : (
                filteredRooms.map((room) => {
                  const otherUserId = getOtherParticipantId(room);
                  const isOnline = otherUserId ? onlineUsers.has(otherUserId) : false;
                  const unread = unreadCounts.get(room.id) || 0;
                  const lastMsg = lastMessages.get(room.id);

                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        setSelectedRoom(room.id);
                        if (isMobile) setShowContacts(false);
                      }}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        background:
                          selectedRoom === room.id
                            ? 'var(--primary-50)'
                            : 'transparent',
                        borderLeft:
                          selectedRoom === room.id
                            ? '3px solid var(--primary-500)'
                            : '3px solid transparent',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {/* Avatar with online dot */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                          size={44}
                          icon={<UserOutlined />}
                          style={{
                            background:
                              selectedRoom === room.id
                                ? 'var(--primary-500)'
                                : 'var(--gray-300)',
                          }}
                        />
                        {room.type === 'direct' && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 1,
                              right: 1,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: isOnline ? '#52c41a' : '#bfbfbf',
                              border: '2px solid #fff',
                            }}
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: 'var(--gray-900)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {room.name ||
                              `${t('chat.chatRoom')} #${room.id.slice(0, 6)}`}
                          </span>
                          {unread > 0 && (
                            <Badge
                              count={unread}
                              size="small"
                              style={{ backgroundColor: 'var(--primary-500)' }}
                            />
                          )}
                        </div>

                        {/* Online status for direct chats */}
                        {room.type === 'direct' && (
                          <div
                            style={{
                              fontSize: 11,
                              color: isOnline
                                ? '#52c41a'
                                : 'var(--gray-400)',
                              marginBottom: 2,
                            }}
                          >
                            {isOnline ? t('chat.online') : t('chat.offline')}
                          </div>
                        )}

                        {/* Last message preview */}
                        <div
                          style={{
                            fontSize: 13,
                            color: unread > 0 ? 'var(--gray-700)' : 'var(--gray-400)',
                            fontWeight: unread > 0 ? 500 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lastMsg
                            ? lastMsg.type === 'file'
                              ? `${t('chat.file')}: ${lastMsg.content}`
                              : lastMsg.content
                            : room.type === 'group'
                              ? t('chat.group')
                              : t('chat.personal')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Chat */}
        {(!isMobile || !showContacts) && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
            }}
          >
            {!selectedRoom ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Empty description={t('chat.selectChat')} />
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {isMobile && (
                    <Button
                      type="text"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setShowContacts(true)}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      size={40}
                      icon={<UserOutlined />}
                      style={{ background: 'var(--primary-500)' }}
                    />
                    {selectedRoomData?.type === 'direct' && (() => {
                      const otherId = selectedRoomData
                        ? getOtherParticipantId(selectedRoomData)
                        : null;
                      const isOn = otherId ? onlineUsers.has(otherId) : false;
                      return (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: isOn ? '#52c41a' : '#bfbfbf',
                            border: '2px solid #fff',
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: 'var(--gray-900)',
                      }}
                    >
                      {selectedRoomData?.name ||
                        `${t('chat.chatRoom')} #${selectedRoom.slice(0, 6)}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {currentTypingUsers.length > 0
                        ? `${currentTypingUsers.join(', ')} ${t('chat.isTyping')}`
                        : selectedRoomData?.type === 'direct'
                          ? (() => {
                              const otherId = selectedRoomData
                                ? getOtherParticipantId(selectedRoomData)
                                : null;
                              const isOn = otherId
                                ? onlineUsers.has(otherId)
                                : false;
                              return (
                                <span style={{ color: isOn ? '#52c41a' : undefined }}>
                                  {isOn ? t('chat.online') : t('chat.offline')}
                                </span>
                              );
                            })()
                          : t('chat.group')}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: 'var(--gray-25)',
                  }}
                >
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <Spin />
                    </div>
                  ) : messages.length === 0 ? (
                    <Empty
                      description={t('chat.noMessages')}
                      style={{ margin: 'auto' }}
                    />
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '65%',
                              padding:
                                msg.type === 'file' && msg.fileUrl && isImageFile(msg.fileUrl)
                                  ? '6px'
                                  : '10px 16px',
                              borderRadius: isMine
                                ? '18px 18px 4px 18px'
                                : '18px 18px 18px 4px',
                              background: isMine
                                ? 'var(--primary-500)'
                                : '#fff',
                              color: isMine ? '#fff' : 'var(--gray-800)',
                              boxShadow: isMine ? 'none' : 'var(--shadow-xs)',
                              border: isMine
                                ? 'none'
                                : '1px solid var(--gray-100)',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Sender name in group chats */}
                            {!isMine &&
                              selectedRoomData?.type === 'group' && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'var(--primary-600)',
                                    marginBottom: 2,
                                    padding:
                                      msg.type === 'file' && msg.fileUrl && isImageFile(msg.fileUrl)
                                        ? '4px 10px 0'
                                        : undefined,
                                  }}
                                >
                                  {getUserName(msg.senderId)}
                                </div>
                              )}

                            {/* Message content */}
                            {msg.type === 'file' && msg.fileUrl ? (
                              <div
                                style={{
                                  padding:
                                    isImageFile(msg.fileUrl) ? '4px' : undefined,
                                }}
                              >
                                {renderFileMessage(msg, isMine)}
                              </div>
                            ) : (
                              <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                                {msg.content}
                              </div>
                            )}

                            {/* Time + read receipt */}
                            <div
                              style={{
                                fontSize: 11,
                                opacity: 0.6,
                                textAlign: 'right',
                                marginTop: 4,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                padding:
                                  msg.type === 'file' && msg.fileUrl && isImageFile(msg.fileUrl)
                                    ? '0 6px 4px'
                                    : undefined,
                              }}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString(
                                'ru-RU',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                              {renderReadReceipt(msg)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {currentTypingUsers.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div
                        style={{
                          padding: '8px 16px',
                          borderRadius: '18px 18px 18px 4px',
                          background: '#fff',
                          border: '1px solid var(--gray-100)',
                          fontSize: 12,
                          color: 'var(--gray-500)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'var(--gray-300)',
                              animation:
                                'pulse 1.4s ease-in-out 0s infinite',
                            }}
                          />
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'var(--gray-300)',
                              animation:
                                'pulse 1.4s ease-in-out 0.2s infinite',
                            }}
                          />
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'var(--gray-300)',
                              animation:
                                'pulse 1.4s ease-in-out 0.4s infinite',
                            }}
                          />
                        </span>
                        <span>
                          {currentTypingUsers.join(', ')} {t('chat.isTyping')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--gray-100)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    background: '#fff',
                  }}
                >
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  />
                  <Tooltip title={t('chat.attachFile')}>
                    <Button
                      type="text"
                      icon={
                        uploading ? (
                          <LoadingOutlined />
                        ) : (
                          <PaperClipOutlined />
                        )
                      }
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{ flexShrink: 0, color: 'var(--gray-500)' }}
                    />
                  </Tooltip>
                  <Input
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      handleTyping();
                    }}
                    placeholder={t('chat.typeMessage')}
                    onPressEnter={handleSendMessage}
                    style={{
                      borderRadius: 99,
                      padding: '8px 18px',
                      background: 'var(--gray-50)',
                    }}
                    variant="borderless"
                  />
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    style={{ flexShrink: 0 }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create room modal */}
      <Modal
        title={t('chat.createChat')}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        width={440}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateRoom}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="name" label={t('chat.chatName')}>
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label={t('chat.chatType')}
            rules={[{ required: true }]}
            initialValue="direct"
          >
            <Select
              options={[
                { value: 'direct', label: t('chat.personal') },
                { value: 'group', label: t('chat.group') },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="participantIds"
            label={t('chat.selectParticipants')}
            rules={[
              {
                required: true,
                message: t('chat.selectParticipants'),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t('chat.selectParticipants')}
              showSearch
              optionFilterProp="label"
              options={allUsers
                .filter((u: any) => u.id !== user?.id)
                .map((u: any) => ({
                  value: u.id,
                  label: `${u.lastName} ${u.firstName}`,
                }))}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              {t('common.create')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChatPage;

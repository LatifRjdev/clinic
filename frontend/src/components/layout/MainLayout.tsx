import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Badge, List, Empty, Spin, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  FolderOutlined,
  MessageOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
  AuditOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  DownOutlined,
  RightOutlined,
  BankOutlined,
  SafetyOutlined,
  ShopOutlined,
  NotificationOutlined,
  AppstoreOutlined,
  FileProtectOutlined,
  ContainerOutlined,
  PieChartOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications';
import { patientsService } from '../../api/services/patients.service';
import type { Notification, Patient } from '../../types';

// Role-based access map: which roles can see which menu keys
const roleAccess: Record<string, string[]> = {
  owner: ['*'], // all access
  sysadmin: ['*'],
  chief_doctor: [
    'dashboard', 'patients', 'scheduling', 'emr', 'telemedicine', 'billing', 'insurance',
    'documents', 'chat', 'tasks', 'inventory', 'counterparty', 'marketing',
    'staff', 'branches', 'analytics', 'reports', 'audit', 'system',
  ],
  admin: [
    'dashboard', 'patients', 'scheduling', 'billing', 'insurance',
    'documents', 'chat', 'tasks', 'inventory', 'counterparty',
    'staff', 'branches', 'analytics', 'reports',
  ],
  doctor: [
    'dashboard', 'patients', 'scheduling', 'emr', 'telemedicine', 'documents', 'chat', 'tasks',
  ],
  nurse: [
    'dashboard', 'patients', 'scheduling', 'emr', 'documents', 'chat', 'tasks', 'inventory',
  ],
  accountant: [
    'dashboard', 'billing', 'insurance', 'documents', 'counterparty', 'reports', 'analytics',
  ],
  reception: [
    'dashboard', 'patients', 'scheduling', 'documents', 'chat',
  ],
  patient: [
    'patient-portal', 'telemedicine',
  ],
};

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number;
  children?: { key: string; label: string; path: string }[];
}

const buildSections = (t: (key: string) => string): { title: string; items: NavItem[] }[] => [
  {
    title: t('nav.sectionMain'),
    items: [
      { key: 'dashboard', label: t('nav.dashboard'), icon: <DashboardOutlined />, path: '/admin' },
      { key: 'patient-portal', label: t('nav.patientPortal'), icon: <UserOutlined />, path: '/admin/patient-portal' },
      { key: 'patients', label: t('nav.patients'), icon: <TeamOutlined />, path: '/admin/patients' },
      {
        key: 'scheduling',
        label: t('nav.scheduling'),
        icon: <CalendarOutlined />,
        children: [
          { key: 'appointments', label: t('nav.appointments'), path: '/admin/scheduling/appointments' },
          { key: 'calendar', label: t('nav.calendar'), path: '/admin/scheduling/calendar' },
          { key: 'doctor-settings', label: t('nav.doctorSettings'), path: '/admin/scheduling/doctor-settings' },
        ],
      },
      { key: 'emr', label: t('nav.emr'), icon: <MedicineBoxOutlined />, path: '/admin/emr' },
      { key: 'telemedicine', label: t('nav.telemedicine'), icon: <VideoCameraOutlined />, path: '/admin/telemedicine' },
      {
        key: 'billing',
        label: t('nav.billing'),
        icon: <DollarOutlined />,
        children: [
          { key: 'services', label: t('nav.services'), path: '/admin/billing/services' },
          { key: 'invoices', label: t('nav.invoices'), path: '/admin/billing/invoices' },
          { key: 'expenses', label: t('nav.expenses'), path: '/admin/billing/expenses' },
          { key: 'payroll', label: t('nav.payroll'), path: '/admin/billing/payroll' },
          { key: 'cash-register', label: t('nav.cashRegister'), path: '/admin/billing/cash-register' },
        ],
      },
      { key: 'insurance', label: t('nav.insurance'), icon: <SafetyOutlined />, path: '/admin/insurance' },
      { key: 'documents', label: t('nav.documents'), icon: <FolderOutlined />, path: '/admin/documents' },
    ],
  },
  {
    title: t('nav.sectionManagement'),
    items: [
      { key: 'chat', label: t('nav.chat'), icon: <MessageOutlined />, path: '/admin/chat' },
      { key: 'tasks', label: t('nav.tasks'), icon: <CheckSquareOutlined />, path: '/admin/tasks' },
      { key: 'inventory', label: t('nav.inventory'), icon: <ContainerOutlined />, path: '/admin/inventory' },
      { key: 'counterparty', label: t('nav.counterparties'), icon: <ShopOutlined />, path: '/admin/counterparty' },
      { key: 'marketing', label: t('nav.marketing'), icon: <NotificationOutlined />, path: '/admin/marketing' },
    ],
  },
  {
    title: t('nav.sectionSystem'),
    items: [
      {
        key: 'staff',
        label: t('nav.staff'),
        icon: <UserOutlined />,
        children: [
          { key: 'staff-profiles', label: t('staff.title'), path: '/admin/staff/profiles' },
          { key: 'staff-departments', label: t('nav.departments'), path: '/admin/staff/departments' },
        ],
      },
      { key: 'branches', label: t('nav.branches'), icon: <BankOutlined />, path: '/admin/branches' },
      { key: 'analytics', label: t('nav.analytics'), icon: <BarChartOutlined />, path: '/admin/analytics' },
      {
        key: 'reports',
        label: t('nav.reports'),
        icon: <PieChartOutlined />,
        children: [
          { key: 'reports-financial', label: t('nav.financialReports'), path: '/admin/reports' },
          { key: 'reports-builder', label: t('nav.reportBuilder'), path: '/admin/reports/builder' },
        ],
      },
      { key: 'audit', label: t('nav.audit'), icon: <AuditOutlined />, path: '/admin/audit' },
      { key: 'system', label: t('nav.system'), icon: <SettingOutlined />, path: '/admin/system' },
    ],
  },
];

const MOBILE_BREAKPOINT = 768;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['scheduling', 'billing', 'staff', 'reports']);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<'RU' | 'TJ' | 'EN'>(
    i18n.language === 'tj' ? 'TJ' : i18n.language === 'en' ? 'EN' : 'RU'
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Track screen size
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; label: string; path: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const switchLang = (l: 'RU' | 'TJ' | 'EN') => {
    setLang(l);
    const code = l === 'TJ' ? 'tj' : l === 'EN' ? 'en' : 'ru';
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  // Notifications
  const { data: notifData } = useNotifications({ limit: 10 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications: Notification[] = Array.isArray(notifData) ? notifData : notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Cmd+K global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchOpen]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); setSearchLoading(false); return; }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearchLoading(true);

    searchTimerRef.current = setTimeout(async () => {
      // Search pages
      const pageResults = buildSections(t)
        .flatMap((s) => s.items.flatMap((item) =>
          item.children
            ? item.children.map((c) => ({ label: c.label, path: c.path }))
            : item.path ? [{ label: item.label, path: item.path }] : []
        ))
        .filter((p) => p.label.toLowerCase().includes(q.toLowerCase()))
        .map((p) => ({ type: t('common.page'), label: p.label, path: p.path }));

      // Search patients via API
      let patientResults: { type: string; label: string; path: string }[] = [];
      try {
        const patients = await patientsService.search(q);
        patientResults = (patients || []).slice(0, 5).map((p: Patient) => ({
          type: t('common.patient'),
          label: `${p.lastName} ${p.firstName}`,
          path: `/admin/patients?search=${encodeURIComponent(q)}`,
        }));
      } catch { /* ignore */ }

      setSearchResults([...pageResults, ...patientResults]);
      setSearchLoading(false);
    }, 300);
  }, [t]);

  const userRole = user?.role || 'doctor';
  const allowedKeys = roleAccess[userRole] || [];
  const hasAccess = (key: string) => allowedKeys.includes('*') || allowedKeys.includes(key);

  // Filter sections based on role
  const allSections = buildSections(t);
  const sections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAccess(item.key)),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarWidth = collapsed ? 80 : 272;

  const toggleSubmenu = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const pageTitle = (() => {
    const map: Record<string, string> = {
      '/admin': t('nav.dashboard'),
      '/admin/patients': t('nav.patients'),
      '/admin/scheduling/appointments': t('nav.appointments'),
      '/admin/scheduling/calendar': t('nav.calendar'),
      '/admin/scheduling/doctor-settings': t('nav.doctorSettings'),
      '/admin/emr': t('nav.emr'),
      '/admin/billing/services': t('nav.services'),
      '/admin/billing/invoices': t('nav.invoices'),
      '/admin/billing/expenses': t('nav.expenses'),
      '/admin/billing/payroll': t('nav.payroll'),
      '/admin/billing/cash-register': t('nav.cashRegister'),
      '/admin/insurance': t('nav.insurance'),
      '/admin/documents': t('nav.documents'),
      '/admin/chat': t('nav.chat'),
      '/admin/tasks': t('nav.tasks'),
      '/admin/inventory': t('nav.inventory'),
      '/admin/counterparty': t('nav.counterparties'),
      '/admin/marketing': t('nav.marketing'),
      '/admin/staff/profiles': t('staff.title'),
      '/admin/staff/departments': t('nav.departments'),
      '/admin/branches': t('nav.branches'),
      '/admin/analytics': t('nav.analytics'),
      '/admin/reports': t('nav.reports'),
      '/admin/reports/builder': t('nav.reportBuilder'),
      '/admin/telemedicine': t('nav.telemedicine'),
      '/admin/audit': t('nav.audit'),
      '/admin/system': t('nav.system'),
      '/admin/profile': t('profile.title'),
      '/admin/notifications': t('notifications.title'),
      '/admin/patient-portal': t('nav.patientPortal'),
    };
    return map[location.pathname] || t('common.page');
  })();

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') navigate('/admin/profile');
    else if (key === 'settings') navigate('/admin/system');
    else if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const userMenuItems = [
    { key: 'profile', label: t('auth.profile'), icon: <UserOutlined /> },
    { key: 'settings', label: t('auth.settings'), icon: <SettingOutlined /> },
    { type: 'divider' as const },
    { key: 'logout', label: t('auth.logout'), icon: <LogoutOutlined />, danger: true },
  ];

  const userInitials = user
    ? `${user.lastName?.charAt(0) || ''}${user.firstName?.charAt(0) || ''}`
    : 'U';
  const userDisplayName = user
    ? `${user.lastName || ''} ${user.firstName || ''}`
    : t('common.user');
  const userRoleLabel = t(`roles.${userRole}`, userRole);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobile && mobileOpen ? 'mobile-open' : ''}`} style={{ width: isMobile ? 272 : sidebarWidth }}>
        {/* Logo */}
        <div className="sidebar-logo" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
          <div className="sidebar-logo-icon">M</div>
          {!collapsed && (
            <div>
              <div className="sidebar-logo-text">MedClinic</div>
              <div className="sidebar-logo-subtitle">{t('app.subtitle')}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div className="sidebar-section" key={section.title}>
              {!collapsed && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {section.items.map((item) => (
                <div key={item.key}>
                  <div
                    className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => {
                      if (item.children) {
                        toggleSubmenu(item.key);
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.badge && (
                          <span className="sidebar-item-badge">{item.badge}</span>
                        )}
                        {item.children && (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                            {expandedMenus.includes(item.key) ? (
                              <DownOutlined />
                            ) : (
                              <RightOutlined />
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {item.children &&
                    !collapsed &&
                    expandedMenus.includes(item.key) && (
                      <div style={{ paddingLeft: 24, marginBottom: 4 }}>
                        {item.children.map((child) => (
                          <div
                            key={child.key}
                            className={`sidebar-item ${location.pathname === child.path ? 'active' : ''}`}
                            onClick={() => navigate(child.path)}
                            style={{ fontSize: 13, padding: '8px 12px' }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background:
                                  location.pathname === child.path
                                    ? 'var(--primary-400)'
                                    : 'rgba(255,255,255,0.25)',
                                flexShrink: 0,
                              }}
                            />
                            <span>{child.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{userInitials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userDisplayName}</div>
              <div className="sidebar-user-role">{userRoleLabel}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        className="main-content-area"
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: 'margin-left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <header className="app-header">
          <div className="app-header-left">
            <button
              className="header-icon-btn"
              onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
            >
              {isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            </button>
            <span className="app-header-title">{pageTitle}</span>
          </div>

          <div className="app-header-right">
            <div className="header-search" onClick={() => setSearchOpen(true)} style={{ cursor: 'pointer' }}>
              <SearchOutlined />
              <span>{t('common.searchPlaceholder')}</span>
              <kbd>⌘K</kbd>
            </div>

            <div className="header-lang-switch">
              <button
                className={`header-lang-btn ${lang === 'RU' ? 'active' : ''}`}
                onClick={() => switchLang('RU')}
              >
                RU
              </button>
              <button
                className={`header-lang-btn ${lang === 'TJ' ? 'active' : ''}`}
                onClick={() => switchLang('TJ')}
              >
                TJ
              </button>
              <button
                className={`header-lang-btn ${lang === 'EN' ? 'active' : ''}`}
                onClick={() => switchLang('EN')}
              >
                EN
              </button>
            </div>

            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              dropdownRender={() => (
                <div style={{
                  background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  width: 380, maxHeight: 440, overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t('notifications.title')}</span>
                    {unreadCount > 0 && (
                      <span
                        style={{ fontSize: 12, color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => markAllRead.mutate()}
                      >
                        {t('notifications.readAll')}
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <Empty description={t('common.noNotifications')} style={{ padding: 32 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <List
                        dataSource={notifications.slice(0, 8)}
                        renderItem={(n: Notification) => (
                          <div
                            key={n.id}
                            style={{
                              padding: '12px 20px', cursor: 'pointer',
                              background: n.isRead ? 'transparent' : 'var(--primary-50)',
                              borderBottom: '1px solid var(--gray-50)',
                              transition: 'background 150ms',
                            }}
                            onClick={() => {
                              if (!n.isRead) markRead.mutate(n.id);
                              if (n.link) navigate(n.link);
                            }}
                          >
                            <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: 13, color: 'var(--gray-800)' }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                              {n.body?.slice(0, 60)}{n.body?.length > 60 ? '...' : ''}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--gray-300)', marginTop: 4 }}>
                              {new Date(n.createdAt).toLocaleString(i18n.language === 'tj' ? 'tg-TJ' : i18n.language === 'en' ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        )}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      padding: '12px 20px', borderTop: '1px solid var(--gray-100)',
                      textAlign: 'center', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, color: 'var(--primary-600)',
                    }}
                    onClick={() => navigate('/admin/notifications')}
                  >
                    {t('notifications.allNotifications')}
                  </div>
                </div>
              )}
            >
              <button className="header-icon-btn">
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
              </button>
            </Dropdown>

            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']} placement="bottomRight">
              <div className="header-user">
                <div className="header-user-avatar">{userInitials.charAt(0)}</div>
                <div>
                  <div className="header-user-name">{userDisplayName}</div>
                  <div className="header-user-role">{user?.email || ''}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '28px 32px', background: 'var(--gray-50)' }}>
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      <Modal
        open={searchOpen}
        onCancel={() => setSearchOpen(false)}
        footer={null}
        closable={false}
        width={560}
        styles={{ body: { padding: 0 } }}
        style={{ top: 80 }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <Input
            ref={searchInputRef}
            prefix={<SearchOutlined style={{ color: 'var(--gray-400)' }} />}
            placeholder={t('common.searchPatientsPages')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            size="large"
            variant="borderless"
            style={{ fontSize: 16 }}
            suffix={
              <kbd style={{
                padding: '2px 6px', borderRadius: 4, background: 'var(--gray-100)',
                fontSize: 11, color: 'var(--gray-400)', border: '1px solid var(--gray-200)',
              }}>ESC</kbd>
            }
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {searchLoading && (
            <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
          )}
          {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
            <Empty description={t('common.nothingFound')} style={{ padding: 32 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
          {!searchLoading && searchResults.map((r, i) => (
            <div
              key={i}
              style={{
                padding: '12px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--gray-50)',
                transition: 'background 100ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => { navigate(r.path); setSearchOpen(false); }}
            >
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--primary-600)',
                background: 'var(--primary-50)', padding: '2px 8px', borderRadius: 4,
                whiteSpace: 'nowrap',
              }}>
                {r.type}
              </span>
              <span style={{ fontWeight: 500, color: 'var(--gray-800)', fontSize: 14 }}>{r.label}</span>
              <RightOutlined style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--gray-300)' }} />
            </div>
          ))}
          {!searchLoading && searchQuery.length < 2 && (
            <div style={{ padding: '20px 24px', color: 'var(--gray-400)', fontSize: 13 }}>
              {t('common.searchMinChars')}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MainLayout;

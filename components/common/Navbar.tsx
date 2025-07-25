import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTE_PATHS } from '../../constants';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getNotifications, markNotificationsRead } from '../../services/notificationService';
import { io, Socket } from 'socket.io-client';

const HomeIcon = () => (
  <img src="/logo/vite.png" alt="RentEase Logo" className="h-7 w-7" />
);

const UserCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944a11.954 11.954 0 007.834 3.055c.097 1.002-.052 2.006-.228 3.003-.176 1.001-.422 2.003-.693 3.002-.271 1-.579 1.999-.938 2.999-.36 1-.803 1.998-1.295 2.997A11.954 11.954 0 0110 18.056a11.954 11.954 0 01-7.834-3.055c-.492-.999-.935-1.998-1.295-2.997-.359-1-.667-1.999-.938-2.999-.271-1.001-.517-2.002-.693-3.002C2.218 6.997 2.069 5.993 2.166 4.999zM10 5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 5zm0 6.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const OwnerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const WishlistIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0l.318.318.318-.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const menu = [
    { label: t('adminSidebar.dashboard'), to: ROUTE_PATHS.ADMIN_DASHBOARD, icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" /></svg> },
    { label: t('adminSidebar.users'), to: ROUTE_PATHS.ADMIN_MANAGE_USERS, icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0z" /></svg> },
    { label: t('adminSidebar.products'), to: ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS, icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg> },
    { label: t('adminSidebar.categories'), to: ROUTE_PATHS.ADMIN_MANAGE_CATEGORIES, icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
    { label: t('adminSidebar.complaints'), to: '/admin/complaints', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg> },
    { label: t('adminSidebar.reports'), to: ROUTE_PATHS.ADMIN_REPORTS, icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg> },
  ];
  return (
    <aside className="bg-black border-r border-gray-900 h-screen fixed top-0 left-0 w-64 flex flex-col z-40">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <span className="text-2xl font-bold text-white">{t('navbar.adminPanel')}</span>
      </div>
      <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
        {menu.map(item => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex items-center px-4 py-2 rounded-lg text-base font-medium transition-colors duration-150 ${location.pathname.startsWith(item.to) ? 'bg-gray-800 text-white font-bold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm sticky top-0 z-30">
          <span className="text-lg font-bold text-blue-700">{t('navbar.adminPanel')}</span>
        </header>
        <main className="flex-1 p-6 md:p-10">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout, isLoading: authIsLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifSocketRef = useRef<Socket | null>(null);

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.LOGIN);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notification: fetch & realtime
  useEffect(() => {
    if (!user?.id) return;
    // Fetch notifications
    getNotifications({ page: 1, limit: 10 })
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      });
    // Socket.io for realtime notification
    const socket = io(process.env.VITE_SOCKET_URL || 'https://renteaseapi-test.onrender.com', {
      auth: { token: localStorage.getItem('authToken') },
      transports: ['websocket']
    });
    notifSocketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join_user', user.id);
    });
    socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Browser Notification เฉพาะเมื่อ permission เป็น granted
      if (window.Notification && Notification.permission === 'granted') {
        new Notification(notification.title || 'New Notification', {
          body: notification.message,
          icon: '/logo/vite.png',
        });
      }
      // แยกเสียงตาม type (ใช้ .wav)
      let audioSrc = '/notification.wav';
      if (notification.type === 'new_message') {
        audioSrc = '/message.wav';
      }
      const audio = new Audio(audioSrc);
      audio.play();
    });
    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // ขอ permission แค่ครั้งเดียวตอน mount
  useEffect(() => {
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleOpenNotifDropdown = async () => {
    setShowNotifDropdown(true);
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      try {
        await markNotificationsRead(unreadIds);
        setNotifications(prev =>
          prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n)
        );
        setUnreadCount(0);
      } catch (e) {
        // ignore error
      }
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={ROUTE_PATHS.HOME} className="flex-shrink-0 text-blue-600 hover:text-blue-700 transition-colors duration-150 flex items-center group">
              <HomeIcon/>
              <span className="ml-2 font-bold text-2xl group-hover:text-blue-700">RentEase</span>
            </Link>
          </div>

          {/* Centered Links for Desktop */}
          {!isAdmin && (
            <div className="hidden md:flex-1 md:flex md:items-center md:justify-center">
                <div className="flex items-baseline space-x-4">
                    <Link
                    to={ROUTE_PATHS.HOME}
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
                    >
                    {t('navbar.home')}
                    </Link>
                    <Link
                    to={ROUTE_PATHS.SEARCH_PRODUCTS}
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
                    >
                    {t('navbar.allProducts')}
                    </Link>
                </div>
            </div>
          )}

          {/* Right side of Navbar */}
          <div className="flex items-center">
            {/* Admin Navbar */}
            {isAdmin && !authIsLoading && user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={ROUTE_PATHS.ADMIN_DASHBOARD}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-150"
                >
                  <ShieldCheckIcon /> {t('navbar.adminPanel')}
                </Link>
                <LanguageSwitcher />
                <Button onClick={handleLogout} variant="outline" size="sm" className="ml-2">{t('navbar.logout')}</Button>
              </div>
            ) : (
            // User Navbar
              <div className="flex items-center">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <LanguageSwitcher />
                  <div className="h-6 border-l border-gray-300 mx-1 sm:mx-2"></div>

                  {!authIsLoading && user && (
                     <>
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
                                aria-label="Notifications"
                                onClick={() => {
                                if (!showNotifDropdown) handleOpenNotifDropdown();
                                else setShowNotifDropdown(false);
                                }}
                            >
                                <BellIcon />
                                {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                                )}
                            </button>
                            {showNotifDropdown && (
                                <div className="absolute right-0 mt-2 w-80 max-w-sm rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                <div className="py-2 max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4 px-2">No notifications yet.</div>
                                    ) : notifications.map((notif) => (
                                    <Link
                                        key={notif.id}
                                        to={notif.link_url || '#'}
                                        className={`block px-4 py-3 text-sm hover:bg-gray-100 ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                        onClick={() => setShowNotifDropdown(false)}
                                    >
                                        <p className={`font-semibold ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                                        <p className="text-gray-500">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                    </Link>
                                    ))}
                                </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center text-gray-600 hover:text-blue-600 focus:outline-none"
                          >
                            {user.profile_picture_url ? (
                                <img
                                    src={user.profile_picture_url}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-blue-200"
                                />
                            ) : (
                                <UserCircleIcon />
                            )}
                          </button>
                          {isDropdownOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                  <p className="font-semibold truncate">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</p>
                                  <p className="text-gray-500 truncate">{user.email}</p>
                                </div>
                                <Link
                                  to={ROUTE_PATHS.PROFILE}
                                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <UserCircleIcon />
                                  <span className="ml-2">{t('navbar.profile')}</span>
                                </Link>
                                <Link
                                    to={ROUTE_PATHS.RENTER_DASHBOARD}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <DashboardIcon />
                                    <span className="ml-2">{t('navbar.renterDashboard')}</span>
                                </Link>
                                <Link
                                    to={ROUTE_PATHS.OWNER_DASHBOARD}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <OwnerIcon />
                                    <span className="ml-2">{t('navbar.ownerDashboard')}</span>
                                </Link>
                                <Link
                                  to={ROUTE_PATHS.CHAT_INBOX}
                                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <ChatIcon />
                                  <span className="ml-2">{t('navbar.chat')}</span>
                                </Link>
                                <Link
                                  to={ROUTE_PATHS.WISHLIST}
                                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <WishlistIcon />
                                  <span className="ml-2">{t('navbar.wishlist')}</span>
                                </Link>
                                <Link
                                  to={ROUTE_PATHS.USER_COMPLAINTS}
                                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="ml-2">{t('navbar.myComplaints')}</span>
                                </Link>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <LogoutIcon />
                                  <span className="ml-2">{t('navbar.logout')}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                     </>
                  )}
                  
                  {!authIsLoading && !user && (
                    <div className="hidden md:flex items-center space-x-2">
                      <Button onClick={() => navigate(ROUTE_PATHS.LOGIN)} variant="outline" size="sm">
                        {t('navbar.login')}
                      </Button>
                      <Button onClick={() => navigate(ROUTE_PATHS.REGISTER)} size="sm">
                        {t('navbar.register')}
                      </Button>
                    </div>
                  )}
                </div>
                
                 {/* Hamburger Menu Button */}
                <div className="md:hidden flex items-center ml-2">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  >
                    <span className="sr-only">Open main menu</span>
                    {/* Icon when menu is closed. */}
                    <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    {/* Icon when menu is open. */}
                    <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && !isAdmin && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-lg z-40" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to={ROUTE_PATHS.HOME}
              className="text-gray-600 hover:bg-gray-100 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('navbar.home')}
            </Link>
            <Link
              to={ROUTE_PATHS.SEARCH_PRODUCTS}
              className="text-gray-600 hover:bg-gray-100 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
               onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('navbar.allProducts')}
            </Link>
          </div>
          {/* If user is not logged in, show login/register in mobile menu */}
          {!user && !authIsLoading && (
            <div className="px-2 pt-2 pb-3 border-t border-gray-200">
               <div className="flex items-center space-x-2">
                 <Button onClick={() => { navigate(ROUTE_PATHS.LOGIN); setIsMobileMenuOpen(false); }} variant="outline" className="w-full">
                   {t('navbar.login')}
                 </Button>
                 <Button onClick={() => { navigate(ROUTE_PATHS.REGISTER); setIsMobileMenuOpen(false); }} className="w-full">
                   {t('navbar.register')}
                 </Button>
               </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

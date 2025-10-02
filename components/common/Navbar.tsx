import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAIAgent } from '../../contexts/AIAgentContext';
import { ROUTE_PATHS } from '../../constants';
import { Button } from '../ui/Button';

import { getNotifications, markNotificationsRead } from '../../services/notificationService';
import { socketService } from '../../services/socketService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell,
  FaHeart,
  FaComments,
  FaHome,
  FaSignOutAlt,
  FaSearch,
  FaBars,
  FaTimes,
  FaShieldAlt,
  FaTachometerAlt,
  FaStore,
  FaExclamationTriangle,
  FaChevronDown,
  FaUser,
  FaRobot,
} from 'react-icons/fa';
import { MessageCircle } from 'lucide-react';

const HomeIcon = () => (
  <img src="/logo/vite.png" alt="RentEase Logo" className="h-8 w-8" />
);

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout, isLoading: authIsLoading } = useAuth();
  const { toggleAgent } = useAIAgent();

  const navigate = useNavigate();




  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Debug: Log user data when component mounts
  useEffect(() => {
    if (user && !isAdmin) {
      console.log('🔍 Navbar User Data:', {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_picture_url: user.profile_picture_url,
        first_name: user.first_name,
        last_name: user.last_name
      });
    }
  }, [user, isAdmin]);

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
      if (window.innerWidth >= 1024) { // lg breakpoint
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
      })
      .catch(error => {
        console.error('Error fetching notifications:', error);
      });

    // Connect to socket service
    const token = localStorage.getItem('authToken');
    if (token) {
      socketService.connect(token)
        .then(() => {
          console.log('Socket connected for notifications');
          // Join user room
          socketService.emit('join_user', user.id);
          
          // Listen for new notifications
          socketService.on('new_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Browser Notification เฉพาะเมื่อ permission เป็น granted
            if (window.Notification && Notification.permission === 'granted') {
              const browserNotification = new Notification(notification.title || 'New Notification', {
                body: notification.message,
                icon: '/logo/vite.png',
              });
              
              // เพิ่มการจัดการการคลิกที่การแจ้งเตือน
              browserNotification.onclick = () => {
                window.focus(); // โฟกัสหน้าต่างกังกับการโหลดจาก public root
                if (notification.link_url) {
                  navigate(notification.link_url); // นำทางไปยังหน้าที่เกี่ยวข้อง
                }
                browserNotification.close(); // ปิดการแจ้งเตือน
              };
            }
            
            // แยกเสียงตาม type (ใช้ .wav)
            let audioSrc = '/notification.wav';
            if (notification.type === 'new_message') {
              audioSrc = '/message.wav';
            }
            const audio = new Audio(audioSrc);
            audio.play();
          });
        })
        .catch(error => {
          console.error('Failed to connect socket for notifications:', error);
        });
    }

    return () => {
      // Cleanup: remove notification listener
      socketService.off('new_notification');
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
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 fixed top-0 left-0 right-0 z-50 shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link to={ROUTE_PATHS.HOME} className="flex-shrink-0 text-blue-600 hover:text-blue-700 transition-all duration-300 flex items-center group">
              <div className="p-1 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                <HomeIcon />
              </div>
              <span className="ml-2 sm:ml-3 font-bold text-xl sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">
                <span className="hidden sm:inline">RentEase</span>
                <span className="sm:hidden">RE</span>
              </span>
            </Link>
          </motion.div>

          {/* Centered Navigation Links for Desktop */}
          {!isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:flex-1 lg:flex lg:items-center lg:justify-center"
            >
              <div className="flex items-baseline space-x-1">
                <Link
                  to={ROUTE_PATHS.HOME}
                  className="text-gray-600 hover:text-blue-600 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 flex items-center gap-2"
                >
                  <FaHome className="h-4 w-4" />
                  <span className="hidden xl:inline">หน้าหลัก</span>
                </Link>
                <Link
                  to={ROUTE_PATHS.SEARCH_PRODUCTS}
                  className="text-gray-600 hover:text-blue-600 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 flex items-center gap-2"
                >
                  <FaSearch className="h-4 w-4" />
                  <span className="hidden xl:inline">สินค้าทั้งหมด</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Right side of Navbar */}
          <div className="flex items-center">
            {/* Admin Navbar */}
            {isAdmin && !authIsLoading && user ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-2 sm:space-x-4"
              >
                <Link
                  to={ROUTE_PATHS.ADMIN_DASHBOARD}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
                >
                  <FaShieldAlt className="h-4 w-4" />
                  <span className="hidden sm:inline">แผงผู้ดูแลระบบ</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                >
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                  <FaSignOutAlt className="sm:hidden h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              // User Navbar
              <div className="flex items-center">
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                  <div className="hidden sm:block">
                  </div>
                  <div className="hidden sm:block h-6 border-l border-gray-300 mx-1 sm:mx-2"></div>

                  {!authIsLoading && user && (
                    <>
                      {/* AI Chat Assistant */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 sm:p-2.5 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex flex-col items-center justify-center"
                        aria-label="AI Assistant"
                        onClick={toggleAgent}
                        title="AI Assistant"
                      >
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mb-0.5" />
                        <span className="text-xs font-semibold text-blue-600">AI</span>
                      </motion.button>

                      {/* Notifications */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                          aria-label="Notifications"
                          onClick={() => {
                            if (!showNotifDropdown) handleOpenNotifDropdown();
                            else setShowNotifDropdown(false);
                          }}
                        >
                          <FaBell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                          {unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm"
                            >
                              {unreadCount}
                            </motion.span>
                          )}
                        </motion.button>
                        <AnimatePresence>
                          {showNotifDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute right-0 mt-2 w-72 sm:w-80 max-w-sm rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100"
                            >
                              <div className="py-2 max-h-96 overflow-y-auto">
                                <div className="px-4 py-2 border-b border-gray-100">
                                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                </div>
                                {notifications.length === 0 ? (
                                  <div className="text-center text-gray-500 py-8 px-4">
                                    <FaBell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p>No notifications yet.</p>
                                  </div>
                                ) : (
                                  notifications.map((notif) => (
                                    <Link
                                      key={notif.id}
                                      to={notif.link_url || '#'}
                                      className={`block px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150 ${!notif.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                      onClick={() => setShowNotifDropdown(false)}
                                    >
                                      <p className={`font-semibold ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                                      <p className="text-gray-500 mt-1">{notif.message}</p>
                                      <p className="text-xs text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                                    </Link>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Profile Dropdown */}
                      <div className="relative" ref={dropdownRef}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex items-center text-gray-600 hover:text-blue-600 focus:outline-none transition-all duration-200"
                        >
                          {!isAdmin ? (
                            <img
                              src={user.profile_picture_url ? user.profile_picture_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || user.username || user.email.split('@')[0])}&background=4F46E5&color=FFFFFF&size=128&rounded=true&bold=true`}
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-blue-200 transition-all duration-200"
                              onLoad={() => {
                                console.log('✅ Profile image loaded successfully:', user.profile_picture_url);
                              }}
                              onError={(e) => {
                                console.log('🔄 Profile image failed to load, using fallback avatar');
                                const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || user.username || user.email.split('@')[0])}&background=4F46E5&color=FFFFFF&size=128&rounded=true&bold=true`;
                                e.currentTarget.src = fallbackUrl;
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center border-2 border-transparent hover:border-red-200 transition-all duration-200">
                              <FaShieldAlt className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <FaChevronDown className={`ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </motion.button>
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="origin-top-right absolute right-0 mt-2 w-56 sm:w-64 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100"
                            >
                              <div className="py-2" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <div className="px-4 py-3 text-sm border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
                                  <p className="font-semibold truncate text-gray-900">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</p>
                                  <p className="text-gray-500 truncate mt-1">{user.email}</p>
                                </div>

                                <div className="py-1">
                                  <Link
                                    to={ROUTE_PATHS.PROFILE}
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => setIsDropdownOpen(false)}
                                  >
                                    <FaUser className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>โปรไฟล์</span>
                                  </Link>
                                  <Link
                                    to={ROUTE_PATHS.RENTER_DASHBOARD}
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => setIsDropdownOpen(false)}
                                  >
                                    <FaTachometerAlt className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>แดชบอร์ดผู้เช่า</span>
                                  </Link>
                                  <Link
                                    to={ROUTE_PATHS.OWNER_DASHBOARD}
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => setIsDropdownOpen(false)}
                                  >
                                    <FaStore className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>แดชบอร์ดเจ้าของ</span>
                                  </Link>
                                  <Link
                                    to={ROUTE_PATHS.CHAT_INBOX}
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => setIsDropdownOpen(false)}
                                  >
                                    <FaComments className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>แชท</span>
                                  </Link>
                                  <Link
                                    to={ROUTE_PATHS.WISHLIST}
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => setIsDropdownOpen(false)}
                                  >
                                    <FaHeart className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>รายการโปรด</span>
                                  </Link>
                                  <Link
                                    to={ROUTE_PATHS.USER_COMPLAINTS}
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => setIsDropdownOpen(false)}
                                  >
                                    <FaExclamationTriangle className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>เรื่องร้องเรียนของฉัน</span>
                                  </Link>
                                </div>

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                  onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                                  className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                >
                                  <FaSignOutAlt className="h-4 w-4 mr-3" />
                                  <span>ออกจากระบบ</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}

                  {!authIsLoading && !user && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="hidden lg:flex items-center space-x-2"
                    >
                      <Button
                        onClick={() => navigate(ROUTE_PATHS.LOGIN)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      >
                        เข้าสู่ระบบ
                      </Button>
                      <Button
                        onClick={() => navigate(ROUTE_PATHS.REGISTER)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                      >
                        สมัครสมาชิก
                      </Button>
                    </motion.div>
                  )}
                </div>

                {/* Hamburger Menu Button */}
                <div className="lg:hidden flex items-center ml-1 sm:ml-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <span className="sr-only">Open main menu</span>
                    <AnimatePresence mode="wait">
                      {isMobileMenuOpen ? (
                        <motion.div
                          key="close"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FaTimes className="h-5 w-5 sm:h-6 sm:w-6" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="menu"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FaBars className="h-5 w-5 sm:h-6 sm:w-6" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-16 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg z-40"
            id="mobile-menu"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link
                to={ROUTE_PATHS.HOME}
                className="text-gray-600 hover:bg-blue-50 hover:text-blue-600 block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-3"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaHome className="h-5 w-5" />
                หน้าหลัก
              </Link>
              <Link
                to={ROUTE_PATHS.SEARCH_PRODUCTS}
                className="text-gray-600 hover:bg-blue-50 hover:text-blue-600 block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-3"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaSearch className="h-5 w-5" />
                สินค้าทั้งหมด
              </Link>
              {user && (
                <button
                  onClick={() => { toggleAgent(); setIsMobileMenuOpen(false); }}
                  className="text-gray-600 hover:bg-blue-50 hover:text-blue-600 block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-3 w-full text-left"
                >
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  AI Assistant
                </button>
              )}

              {/* Language Switcher in Mobile Menu */}
              <div className="px-4 py-3 border-t border-gray-200 mt-2">
                <div className="flex items-center gap-3">
                </div>
              </div>
            </div>
            {/* If user is not logged in, show login/register in mobile menu */}
            {!user && !authIsLoading && (
              <div className="px-4 pt-2 pb-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => { navigate(ROUTE_PATHS.LOGIN); setIsMobileMenuOpen(false); }}
                    variant="outline"
                    className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                  >
                    เข้าสู่ระบบ
                  </Button>
                  <Button
                    onClick={() => { navigate(ROUTE_PATHS.REGISTER); setIsMobileMenuOpen(false); }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    สมัครสมาชิก
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

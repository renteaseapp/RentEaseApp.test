import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTE_PATHS } from '../../constants';
import { motion } from 'framer-motion';
import { 
  FaChartBar, 
  FaUsers, 
  FaBox, 
  FaTags, 
  FaExclamationTriangle, 
  FaChartLine,
  FaShieldAlt,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaSignOutAlt,
  FaGlobe,
  FaCog,
  FaHistory,
  FaBars,
  FaTimes,
  FaFileContract
} from 'react-icons/fa';

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse,
  isMobileOpen = false,
  onMobileToggle
}) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  
  // Close mobile sidebar when route changes
  useEffect(() => {
    if (onMobileToggle) {
      onMobileToggle(false);
    }
  }, [location.pathname, onMobileToggle]);
  
  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onMobileToggle) {
        onMobileToggle(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, onMobileToggle]);
  
  const menu = [
    { 
      label: 'แดชบอร์ด', 
      to: ROUTE_PATHS.ADMIN_DASHBOARD, 
      icon: <FaChartBar className="h-5 w-5" />,
      color: "from-blue-500 to-blue-600"
    },
    { 
      label: 'ผู้ใช้', 
      to: ROUTE_PATHS.ADMIN_MANAGE_USERS, 
      icon: <FaUsers className="h-5 w-5" />,
      color: "from-green-500 to-green-600"
    },
    { 
      label: 'สินค้า', 
      to: ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS, 
      icon: <FaBox className="h-5 w-5" />,
      color: "from-purple-500 to-purple-600"
    },
    { 
      label: 'หมวดหมู่', 
      to: ROUTE_PATHS.ADMIN_MANAGE_CATEGORIES, 
      icon: <FaTags className="h-5 w-5" />,
      color: "from-yellow-500 to-yellow-600"
    },
    { 
      label: 'การเช่า', 
      to: ROUTE_PATHS.ADMIN_MANAGE_RENTALS, 
      icon: <FaFileContract className="h-5 w-5" />,
      color: "from-teal-500 to-teal-600"
    },
    { 
      label: 'เรื่องร้องเรียน', 
      to: '/admin/complaints', 
      icon: <FaExclamationTriangle className="h-5 w-5" />,
      color: "from-red-500 to-red-600"
    },
    { 
      label: 'รายงาน & สถิติ', 
      to: ROUTE_PATHS.ADMIN_REPORTS, 
      icon: <FaChartLine className="h-5 w-5" />,
      color: "from-indigo-500 to-indigo-600"
    },
    { 
      label: 'ประวัติการกระทำ', 
      to: ROUTE_PATHS.ADMIN_LOGS, 
      icon: <FaHistory className="h-5 w-5" />,
      color: "from-orange-500 to-orange-600"
    },
    { 
      label: 'การตั้งค่าระบบ', 
      to: ROUTE_PATHS.ADMIN_SETTINGS, 
      icon: <FaCog className="h-5 w-5" />,
      color: "from-gray-500 to-gray-600"
    },
  ];

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse(!isCollapsed);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => onMobileToggle && onMobileToggle(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 h-screen fixed top-0 left-0 flex flex-col z-40 transition-all duration-300 shadow-2xl
        ${isCollapsed ? 'w-16' : 'w-64'}
        lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <FaShieldAlt className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                แผงผู้ดูแลระบบ
              </span>
            </motion.div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            <button
              onClick={() => onMobileToggle && onMobileToggle(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
              title="ปิด Sidebar"
            >
              <FaTimes className="h-4 w-4" />
            </button>
            
            {/* Desktop Collapse Button */}
            <button
              onClick={handleToggleCollapse}
              className="hidden lg:block p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
              title="ซ่อน/แสดงแถบด้านข้าง"
            >
              {isCollapsed ? <FaChevronRight className="h-4 w-4" /> : <FaChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {menu.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={item.to}
              className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname.startsWith(item.to) 
                  ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg transform scale-105' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                location.pathname.startsWith(item.to)
                  ? 'bg-white/20'
                  : 'bg-gray-700/50 group-hover:bg-gray-600/50'
              }`}>
                {item.icon}
              </div>
              {!isCollapsed && (
                <motion.span 
                  className="ml-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          </motion.div>
        ))}
      </nav>

        {/* User Profile Section */}
        {!isCollapsed && user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t border-gray-700"
          >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <FaUser className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="ออกจากระบบ"
            >
              <FaSignOutAlt className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

        {/* Collapsed User Profile */}
        {isCollapsed && user && (
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="w-full p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="ออกจากระบบ"
            >
              <FaSignOutAlt className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaUser } from 'react-icons/fa';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
      />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="flex-1 p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children || <Outlet />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}; 
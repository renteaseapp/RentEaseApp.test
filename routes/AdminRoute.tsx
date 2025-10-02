import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTE_PATHS } from '../constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';


interface AdminRouteProps {
  // children?: React.ReactNode; // Not needed when using Outlet
}

export const AdminRoute: React.FC<AdminRouteProps> = () => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner message="กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ" /></div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to={ROUTE_PATHS.ADMIN_LOGIN} replace />;
  }

  return <Outlet />;
};

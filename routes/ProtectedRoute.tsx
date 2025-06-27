import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTE_PATHS } from '../constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  // children?: React.ReactNode; // Not needed when using Outlet
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner message={t('protectedRoute.authenticating')} /></div>;
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  if (isAdmin) {
    // ถ้าเป็น admin ไม่ให้เข้า route user ปกติ
    return <Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />;
  }

  return <Outlet />; // Renders the child route's element
};

export const RenterRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, isOwner, isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner message={t('protectedRoute.authenticating')} /></div>;
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  if (isAdmin) {
    // ถ้าเป็น admin ไม่ให้เข้า route user ปกติ
    return <Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />;
  }

  if (isOwner) {
    // ถ้าเป็น owner ไม่ให้เข้า route นี้
    return <Navigate to={ROUTE_PATHS.HOME} replace />;
  }

  return <Outlet />;
};

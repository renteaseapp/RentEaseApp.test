import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTE_PATHS } from '../constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface AdminRouteProps {
  // children?: React.ReactNode; // Not needed when using Outlet
}

export const AdminRoute: React.FC<AdminRouteProps> = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner message={t('adminRoute.authenticatingAdmin')} /></div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to={ROUTE_PATHS.ADMIN_LOGIN} replace />;
  }

  return <Outlet />;
};

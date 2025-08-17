import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTE_PATHS } from '../constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { UserIdVerificationStatus } from '../types';

interface ProtectedRouteProps {
  // children?: React.ReactNode; // Not needed when using Outlet
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

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

  // Only allow these paths if not verified
  const allowedIfNotVerified = [
    ROUTE_PATHS.HOME,
    ROUTE_PATHS.SEARCH_PRODUCTS,
    ROUTE_PATHS.ID_VERIFICATION,
    ROUTE_PATHS.PROFILE, // เพิ่มบรรทัดนี้
  ];
  // Allow product detail dynamic route
  const isProductDetail = location.pathname.startsWith('/products/');
  const isAllowed = allowedIfNotVerified.some(path => location.pathname === path) || isProductDetail;
  const isVerified = user.id_verification_status === UserIdVerificationStatus.APPROVED || String(user.id_verification_status) === 'verified';

  if (!isVerified && !isAllowed) {
    return <Navigate to={ROUTE_PATHS.ID_VERIFICATION} replace state={{ from: location }} />;
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

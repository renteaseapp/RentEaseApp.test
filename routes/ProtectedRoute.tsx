import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTE_PATHS } from '../constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

import { UserIdVerificationStatus } from '../types';

interface ProtectedRouteProps {
  // children?: React.ReactNode; // Not needed when using Outlet
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner message="กำลังตรวจสอบสิทธิ์การเข้าถึง" /></div>;
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

  // Add debugging logs
  console.log('🔍 RenterRoute Debug:', { 
    userId: user?.id, 
    isOwner, 
    isAdmin, 
    isLoading,
    userEmail: user?.email 
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner message="กำลังตรวจสอบสิทธิ์การเข้าถึง" /></div>;
  }

  if (!user) {
    console.log('❌ RenterRoute: No user, redirecting to login');
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  if (isAdmin) {
    console.log('❌ RenterRoute: User is admin, redirecting to admin dashboard');
    // ถ้าเป็น admin ไม่ให้เข้า route user ปกติ
    return <Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />;
  }

  // ปรับปรุง logic: ให้ user เข้า renter routes ได้แม้ว่าจะเป็น owner ก็ตาม
  // เพราะ user อาจจะต้องการดูข้อมูล rental ของตัวเองในฐานะ renter
  if (isOwner) {
    console.log('⚠️ RenterRoute: User is owner but allowing access to renter routes');
    // ไม่ redirect แล้ว ให้เข้าได้
  }

  console.log('✅ RenterRoute: User can access renter routes');
  return <Outlet />;
};
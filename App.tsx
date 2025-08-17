import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { AIChatProvider } from './contexts/AIChatContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import AIChatWidget from './components/common/AIChatWidget';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';

import { HomePage } from './features/products/HomePage';
import { ProductDetailPage } from './features/products/ProductDetailPage';
import { SearchPage } from './features/products/SearchPage';

import { UserProfilePage } from './features/user/UserProfilePage';
import UserIdVerificationPage from './features/user/UserIdVerificationPage';
import UserComplaintsPage from './features/complaints/UserComplaintsPage';

import { ProtectedRoute, RenterRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { ROUTE_PATHS } from './constants';

// Owner features
import { OwnerDashboardPage } from './features/owner/OwnerDashboardPage';
import { MyListingsPage } from './features/owner/MyListingsPage';
import { ProductFormPage } from './features/owner/ProductFormPage';
import { OwnerRentalHistoryPage } from './features/owner/OwnerRentalHistoryPage';
import { OwnerRentalDetailPage } from './features/owner/OwnerRentalDetailPage';
import { PayoutInfoPage } from './features/owner/PayoutInfoPage';
import OwnerReportPage from './features/owner/OwnerReportPage';

// Renter features
import { RenterDashboardPage } from './features/renter/RenterDashboardPage';
import { MyRentalsPage } from './features/renter/MyRentalsPage';
import { PaymentPage } from './features/renter/PaymentPage';
import { RenterRentalDetailPage } from './features/renter/RenterRentalDetailPage';
import { SubmitReviewPage } from './features/renter/SubmitReviewPage';
import { WishlistPage } from './features/user/WishlistPage';

// Chat features
import { ChatInboxPage } from './features/chat/ChatInboxPage';
import { ChatRoomPage } from './features/chat/ChatRoomPage';

// Static pages
import { StaticPage } from './features/static/StaticPage';
import { FaqPage } from './features/static/FaqPage';

// Admin features
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { AdminManageUsersPage } from './features/admin/AdminManageUsersPage';
import { AdminUserDetailPage } from './features/admin/AdminUserDetailPage';
import { AdminManageProductsPage } from './features/admin/AdminManageProductsPage';
import { AdminProductDetailPage } from './features/admin/AdminProductDetailPage';
import { AdminManageCategoriesPage } from './features/admin/AdminManageCategoriesPage';
import { AdminReportsPage } from './features/admin/AdminReportsPage';
import { AdminLoginPage } from './features/admin/AdminLoginPage';
import AdminComplaintsPage from './features/admin/AdminComplaintsPage';
import { AdminSettingsPage } from './features/admin/AdminSettingsPage';
import AdminLogsPage from './features/admin/AdminLogsPage';
import { initializeTimezone } from './utils/timezoneUtils';
import RealtimeNotification from './components/common/RealtimeNotification';
import { setupGlobalErrorHandling } from './utils/errorHandler';

const AppContent: React.FC = () => {
  // Initialize timezone on app startup
  React.useEffect(() => {
    initializeTimezone();
    // Setup global error handling for browser extension conflicts
    setupGlobalErrorHandling();
  }, []);
  const location = useLocation();
  const noFooterPaths = [
    ROUTE_PATHS.CHAT_ROOM,
    '/admin', // Hide footer on all admin pages
  ];
  const shouldShowFooter = !noFooterPaths.some(path => location.pathname.startsWith(path.split('/:')[0]));

  return (
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <AIChatWidget />
            <RealtimeNotification />
            <main className="flex-grow bg-gray-100">
              <Routes>
                {/* Public Routes */}
                <Route path={ROUTE_PATHS.HOME} element={<HomePage />} />
                <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
          <Route path={ROUTE_PATHS.ADMIN_LOGIN} element={<AdminLoginPage />} />
                <Route path={ROUTE_PATHS.REGISTER} element={<RegisterPage />} />
                <Route path={ROUTE_PATHS.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
                <Route path={ROUTE_PATHS.PRODUCT_DETAIL} element={<ProductDetailPage />} />
                <Route path={ROUTE_PATHS.SEARCH_PRODUCTS} element={<SearchPage />} />
                <Route path={ROUTE_PATHS.ABOUT_US} element={<StaticPage pageSlug="about-us" />} />
                <Route path={ROUTE_PATHS.TERMS_OF_SERVICE} element={<StaticPage pageSlug="terms-of-service" />} />
                <Route path={ROUTE_PATHS.PRIVACY_POLICY} element={<StaticPage pageSlug="privacy-policy" />} />
                <Route path={ROUTE_PATHS.FAQ} element={<FaqPage />} />

                {/* Owner-only Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path={ROUTE_PATHS.PROFILE} element={<UserProfilePage />} />
                  <Route path={ROUTE_PATHS.ID_VERIFICATION} element={<UserIdVerificationPage />} />
                  <Route path={ROUTE_PATHS.OWNER_DASHBOARD} element={<OwnerDashboardPage />} />
                  <Route path={ROUTE_PATHS.MY_LISTINGS} element={<MyListingsPage />} />
                  <Route path={ROUTE_PATHS.CREATE_PRODUCT} element={<ProductFormPage />} />
                  <Route path={ROUTE_PATHS.EDIT_PRODUCT} element={<ProductFormPage />} />
                  <Route path={ROUTE_PATHS.OWNER_RENTAL_HISTORY} element={<OwnerRentalHistoryPage />} />
                  <Route path={ROUTE_PATHS.OWNER_RENTAL_DETAIL} element={<OwnerRentalDetailPage />} />
                  <Route path={ROUTE_PATHS.PAYOUT_INFO} element={<PayoutInfoPage />} />
                  <Route path={ROUTE_PATHS.OWNER_REPORT} element={<OwnerReportPage />} />
                </Route>

                {/* Renter-only Routes */}
                <Route element={<RenterRoute />}>
                  <Route path={ROUTE_PATHS.PAYMENT_PAGE} element={<PaymentPage />} />
                  <Route path={ROUTE_PATHS.RENTER_RENTAL_DETAIL} element={<RenterRentalDetailPage />} />
                  <Route path={ROUTE_PATHS.SUBMIT_REVIEW} element={<SubmitReviewPage />} />
                </Route>

                {/* Shared Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path={ROUTE_PATHS.CHAT_INBOX} element={<ChatInboxPage />} />
                  <Route path={ROUTE_PATHS.CHAT_ROOM} element={<ChatRoomPage />} />
                  <Route path={ROUTE_PATHS.USER_COMPLAINTS} element={<UserComplaintsPage />} />
                  <Route path={ROUTE_PATHS.RENTER_DASHBOARD} element={<RenterDashboardPage />} />
                  <Route path={ROUTE_PATHS.MY_RENTALS_RENTER} element={<MyRentalsPage />} />
                  <Route path={ROUTE_PATHS.WISHLIST} element={<WishlistPage />} />
                </Route>

                {/* Admin Routes (User must be logged in AND be an admin) */}
                <Route element={<AdminRoute />}>
                  <Route path={ROUTE_PATHS.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_USERS} element={<AdminManageUsersPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_USER_DETAIL} element={<AdminUserDetailPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS} element={<AdminManageProductsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_PRODUCT_DETAIL} element={<AdminProductDetailPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_CATEGORIES} element={<AdminManageCategoriesPage />} />
                  <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_REPORTS} element={<AdminReportsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_LOGS} element={<AdminLogsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to={ROUTE_PATHS.HOME} replace />} />
              </Routes>
            </main>
      {shouldShowFooter && <Footer />}
          </div>
  );
};

const App: React.FC = () => {
  const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <AuthProvider>
        <AlertProvider>
          <AIChatProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AIChatProvider>
        </AlertProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;

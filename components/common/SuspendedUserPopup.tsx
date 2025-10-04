import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../services/socketService';

import { FaExclamationTriangle, FaEnvelope, FaUserLock, FaSignOutAlt } from 'react-icons/fa';

export const SuspendedUserPopup: React.FC = () => {
  const { user, refreshUserData, isLoading, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger

  // Get user ID from multiple sources
  const getUserId = () => {
    // Priority 1: Current user object
    if (user?.id) {
      return user.id;
    }
    
    // Priority 2: suspendedUser in localStorage
    try {
      const suspendedUserData = localStorage.getItem('suspendedUser');
      if (suspendedUserData) {
        const parsedSuspendedUser = JSON.parse(suspendedUserData);
        if (parsedSuspendedUser?.id) {
          return parsedSuspendedUser.id;
        }
      }
    } catch (error) {
      console.error('Error parsing suspendedUser data for ID:', error);
    }
    
    // Priority 3: userData in localStorage
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedUser = JSON.parse(storedUserData);
        if (parsedUser?.id) {
          return parsedUser.id;
        }
      }
    } catch (error) {
      console.error('Error parsing userData for ID:', error);
    }
    
    return 'N/A';
  };

  // Check if user is suspended (inactive)
  // Check multiple sources for faster detection
  const isSuspended = React.useMemo(() => {
    console.log('🔍 SuspendedUserPopup Debug:', {
      user: user,
      isLoading: isLoading,
      userIsActive: user?.is_active,
      userExists: !!user
    });

    // Priority 1: Check current user object first
    if (user) {
      if (user.is_active === false) {
        console.log('✅ User is suspended via user object');
        return true;
      } else if (user.is_active === true) {
        // If current user is active, clear any old suspendedUser data and return false
        console.log('✅ User is active - clearing old suspension data');
        localStorage.removeItem('suspendedUser');
        return false;
      }
    }
    
    // Priority 2: Only check suspendedUser in localStorage if no current user data
    if (!user) {
      try {
        const suspendedUserData = localStorage.getItem('suspendedUser');
        if (suspendedUserData) {
          const parsedSuspendedUser = JSON.parse(suspendedUserData);
          console.log('🚨 Found suspendedUser in localStorage (no current user):', parsedSuspendedUser);
          if (parsedSuspendedUser && parsedSuspendedUser.is_active === false) {
            console.log('✅ User is suspended via suspendedUser localStorage');
            return true;
          }
        }
      } catch (error) {
        console.error('Error parsing suspendedUser data:', error);
      }
    }
    
    // Priority 3: Check regular userData in localStorage (fallback, only if no user)
    if (!user) {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          console.log('📦 Checking userData in localStorage:', parsedUser);
          const isSuspendedFromStorage = parsedUser && parsedUser.is_active === false;
          if (isSuspendedFromStorage) {
            console.log('✅ User is suspended via userData localStorage');
            return true;
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    
    console.log('❌ User is not suspended');
    return false;
  }, [user, isLoading, forceUpdate]); // Add forceUpdate to dependencies

  // Listen for localStorage changes (when user gets unbanned via socket)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('📦 localStorage changed - forcing popup re-evaluation');
      // Use setTimeout to ensure immediate response
      setTimeout(() => {
        setForceUpdate(prev => prev + 1);
      }, 0);
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when localStorage is modified programmatically
    const handleCustomStorageChange = (event: any) => {
      console.log('🔄 Custom storage change detected:', event.detail);
      // Immediate response for unban events
      if (event.detail?.key === 'suspendedUser' && event.detail?.action === 'remove') {
        console.log('⚡ IMMEDIATE UNBAN - forcing popup hide');
        setForceUpdate(prev => prev + 1);
      } else {
        // Use setTimeout for other events
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
        }, 0);
      }
    };
    
    window.addEventListener('localStorageChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleCustomStorageChange);
    };
  }, []);

  // Refresh user data periodically only when popup is visible (isSuspended)
  useEffect(() => {
    // Run periodic refresh only when popup is shown
    if (!isSuspended) return;

    const interval = setInterval(async () => {
      // Skip refresh if socket is connected
      const isSocketConnected = socketService.getConnectionStatus?.() ?? false;
      if (isSocketConnected) {
        console.log('🔌 Socket connected - skip periodic refresh');
        return;
      }

      // Fallback: Check recent socket activity
      const lastSocketUpdate = localStorage.getItem('lastSocketUpdate');
      const now = Date.now();
      if (lastSocketUpdate && (now - parseInt(lastSocketUpdate)) < 30000) {
        console.log('🔌 Recent socket activity - skipping periodic refresh');
        return;
      }

      console.log('🔄 Periodic refresh (socket inactive)');
      setIsRefreshing(true);
      try {
        await refreshUserData();
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isSuspended, refreshUserData]);

  // Prevent body scrolling when popup is shown
  useEffect(() => {
    if (isSuspended) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSuspended]);

  if (!isSuspended) {
    console.log('🚫 Popup not showing - isSuspended is false');
    return null;
  }

  console.log('🎯 Showing SuspendedUserPopup!');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 border-red-500 relative z-[10000]">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 rounded-t-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <FaUserLock className="h-12 w-12" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">บัญชีของคุณถูกระงับ</h2>
          <p className="text-red-100">บัญชีของคุณถูกระงับชั่วคราว กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <FaExclamationTriangle className="text-red-500 h-6 w-6 mr-3 flex-shrink-0" />
            <p className="text-red-700 text-sm">
              หากคุณเชื่อว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบเพื่อขอให้ตรวจสอบและปลดล็อกบัญชีของคุณ
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <FaEnvelope className="h-4 w-4 text-blue-500 mr-2" />
                ติดต่อผ่านอีเมล
              </h3>
              <a 
                href="mailto:rentease.com@gmail.com" 
                className="text-blue-600 hover:text-blue-800 font-medium break-all"
              >
                rentease.com@gmail.com
              </a>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              กรุณาระบุรายละเอียดบัญชีของคุณเมื่อติดต่อเพื่อขอความช่วยเหลือ
            </p>
            <p className="text-gray-500 text-sm mt-1">
              รหัสบัญชี: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{getUserId()}</span>
            </p>
          </div>

          {/* Logout Button */}
          <div className="mt-6 text-center">
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <FaSignOutAlt className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl text-center">
          <p className="text-gray-600 text-sm">
            คุณไม่สามารถปิดหน้าต่างนี้ได้จนกว่าบัญชีของคุณจะได้รับการปลดล็อก
          </p>
          {isRefreshing && (
            <p className="text-gray-500 text-xs mt-2">
              กำลังตรวจสอบสถานะบัญชี...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
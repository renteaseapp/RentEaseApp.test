import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { User, AuthContextType } from '../types';
import { getCurrentUser } from '../services/userService';
import { socketService } from '../services/socketService';
import { validateTokenForSocket } from '../utils/jwtDebug';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        let storedToken = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');
        const storedIsAdmin = localStorage.getItem('isAdmin');
        
        if (storedToken && storedUserData) {
          try {
            // Validate token before restoring session
            const { valid, reason } = validateTokenForSocket(storedToken!);
            if (!valid) {
              console.log(`❌ Token invalid on restore: ${reason}. Fallback connect...`);
              setTokenExpired(true); // Set flag for UI
              // Fallback: Try socket with old token (no refresh since no backend)
              try {
                socketService.connect(storedToken!);
                console.log('🔄 Socket fallback connected with old token');
              } catch (fallbackError) {
                console.error('❌ Fallback socket failed, will prompt login after delay');
                // Delay clear to allow UI load (5s)
                setTimeout(() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userData');
                  localStorage.removeItem('isAdmin');
                  setToken(null);
                  setUser(null);
                  setIsAdmin(false);
                  setIsOwner(false);
                  setTokenExpired(false);
                }, 5000);
              }
              // Proceed with partial restore (user data for UI)
              const userData = JSON.parse(storedUserData);
              setToken(storedToken);
              setUser(userData);
              setIsAdmin(storedIsAdmin === 'true');
              setIsOwner(false);
              setIsLoading(false);
              return; // Exit early, no full refresh
            }

            // Valid token, proceed normal
            const userData = JSON.parse(storedUserData);
            setToken(storedToken);
            setUser(userData);
            setIsAdmin(storedIsAdmin === 'true');
            setIsOwner(false); // Default to false, will be set based on user data structure
            
            // Connect to socket service with error handling (now with valid/fresh token)
            try {
              socketService.connect(storedToken!)
                .then(() => {
                  console.log('Socket connected on session restore');
                })
                .catch((socketError) => {
                  console.error('Failed to connect to socket service on session restore:', socketError);
                  // Don't block session restoration if socket fails
                });
            } catch (socketError) {
              console.error('Failed to connect to socket service on session restore:', socketError);
              // Don't block session restoration if socket fails
            }
            
            // Fetch fresh user data after restoring session
            try {
              const freshUserData = await getCurrentUser();
              setUser(freshUserData);
              localStorage.setItem('userData', JSON.stringify(freshUserData));
              console.log('✅ User data refreshed on session restore:', freshUserData);
            } catch (refreshError: any) {
              console.error('❌ Failed to refresh user data on session restore:', refreshError);
              
              // Check if it's a 403 error for suspended account
              if (axios.isAxiosError(refreshError) && 
                  refreshError.response?.status === 403 && 
                  refreshError.response?.data?.message === "Account is deactivated") {
                // For suspended accounts, we still want to keep them logged in
                // but update their status to show the suspended popup
                try {
                  const parsedUserData = JSON.parse(storedUserData);
                  const suspendedUser = { ...parsedUserData, is_active: false };
                  setUser(suspendedUser);
                  localStorage.setItem('userData', JSON.stringify(suspendedUser));
                  console.log('✅ Suspended user restored with inactive status');
                  // Keep the user logged in, don't clear session
                  return;
                } catch (parseError) {
                  console.error('Failed to parse stored user data for suspended account:', parseError);
                  // Even if parsing fails, try to keep basic suspended state
                  setUser({ is_active: false } as User);
                  return;
                }
              }
              
              // For other errors (like network issues), don't immediately logout
              // Try to use cached user data if available
              try {
                const parsedUserData = JSON.parse(storedUserData);
                setUser(parsedUserData);
                console.log('✅ Using cached user data due to refresh error');
                return;
              } catch (parseError) {
                console.error('Failed to parse cached user data:', parseError);
              }
              
              // Only clear session if we can't recover at all
              console.log('⚠️ Clearing session due to unrecoverable error');
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('isAdmin');
              setToken(null);
              setUser(null);
              setIsAdmin(false);
              setIsOwner(false);
            }

          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
            // Clear invalid data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('isAdmin');
          }
        }
      } catch (error) {
        console.error('Session restoration error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    // ตรวจสอบ owner เฉพาะเมื่อ user login แล้ว
    const checkOwner = async () => {
      if (user && token) {
        try {
          console.log('🔍 Checking if user is owner...', { userId: user.id, userEmail: user.email });
          
          // วิธีที่ 1: ลองเรียก owner API
          try {
            const res = await import('../services/ownerService');
            const dashboard = await res.getOwnerDashboardData(user.id);
            // ถ้า API call สำเร็จและมี products แสดงว่าเป็น owner
            const hasProducts = (dashboard.data.total_my_products || 0) > 0;
            console.log('✅ Owner check result (API):', { hasProducts, totalProducts: dashboard.data.total_my_products });
            setIsOwner(hasProducts);
            return; // ถ้าสำเร็จให้ออกจาก function
          } catch (apiError) {
            console.log('❌ Owner API call failed:', apiError);
            // ถ้า API call ล้มเหลว ให้ใช้วิธีที่ 2
          }
          
          // วิธีที่ 2: ตรวจสอบจาก user data หรือ localStorage
          // ถ้าไม่มี owner data ใน localStorage แสดงว่าไม่ใช่ owner
          const ownerData = localStorage.getItem('ownerData');
          if (ownerData) {
            try {
              const parsed = JSON.parse(ownerData);
              const hasProducts = (parsed.total_my_products || 0) > 0;
              console.log('✅ Owner check result (localStorage):', { hasProducts, totalProducts: parsed.total_my_products });
              setIsOwner(hasProducts);
              return;
            } catch (parseError) {
              console.log('❌ Failed to parse owner data from localStorage');
            }
          }
          
          // ถ้าไม่มีข้อมูลใดๆ แสดงว่าไม่ใช่ owner
          console.log('✅ User is not an owner (no owner data found)');
          setIsOwner(false);
          
        } catch (error) {
          // ถ้าเกิด error อื่นๆ แสดงว่าไม่ใช่ owner
          console.log('❌ Error during owner check:', error);
          setIsOwner(false);
        }
      } else {
        console.log('🔍 No user or token, setting isOwner to false');
        setIsOwner(false);
      }
    };
    checkOwner();
  }, [user, token]);

  // Socket event listeners for real-time user updates
  useEffect(() => {
    if (user && token) {
      // Listen for user updates from socket
      const handleUserUpdate = (updatedUserData: any) => {
        console.log('⚡ Socket: Received user_updated event:', updatedUserData);
        
        // Update socket activity timestamp
        localStorage.setItem('lastSocketUpdate', Date.now().toString());
        
        // Check if this update is for the current user
        if (updatedUserData.id === user.id) {
          console.log('👤 Updating current user data');
          setUser(updatedUserData);
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          
          // Immediate suspension handling - set suspendedUser immediately for faster popup
          if (!updatedUserData.is_active) {
            localStorage.setItem('suspendedUser', JSON.stringify(updatedUserData));
            console.log('🚨 IMMEDIATE: User suspended - stored in localStorage for instant popup');
            // Dispatch custom event for popup to react
            window.dispatchEvent(new CustomEvent('localStorageChanged', { detail: { key: 'suspendedUser', action: 'set' } }));
          } else {
            // If user was unsuspended, remove from localStorage
            localStorage.removeItem('suspendedUser');
            console.log('✅ User unsuspended - removed from localStorage');
            // Dispatch custom event for popup to react immediately
            window.dispatchEvent(new CustomEvent('localStorageChanged', { detail: { key: 'suspendedUser', action: 'remove' } }));
          }
        }
      };

      // Set up socket listener
      socketService.onUserUpdated(handleUserUpdate);

      // Cleanup function
      return () => {
        socketService.off('user_updated');
      };
    }
  }, [user, token]);

  const login = useCallback((token: string, userData: User, isAdminFlag: boolean) => {
    try {
      console.log('🔍 AuthContext.login called with:', { token: token ? 'present' : 'missing', userData, isAdminFlag });
      
      // Validate new token
      const { valid, reason } = validateTokenForSocket(token);
      if (!valid) {
        console.error(`❌ Login token invalid: ${reason}`);
        logout(); // Clear and logout
        return;
      }
      
      setToken(token);
      setUser(userData);
      setIsAdmin(isAdminFlag);
      setIsOwner(false); // Default to false, will be set based on user data structure
      setTokenExpired(false); // Reset flag
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('isAdmin', isAdminFlag.toString());
      
      console.log('🔍 Auth state updated, localStorage saved');
      
      // Connect to socket service with error handling
      socketService.connect(token)
        .then(() => {
          console.log('Socket connected successfully');
        })
        .catch((socketError) => {
          console.error('Failed to connect to socket service:', socketError);
          // Don't block login if socket fails
        });
    } catch (error) {
      console.error('Login error:', error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setToken(null);
      setUser(null);
      setIsAdmin(false);
      setIsOwner(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('isAdmin');
      
      // Disconnect from socket service with error handling
      try {
        socketService.disconnect();
      } catch (socketError) {
        console.error('Failed to disconnect from socket service:', socketError);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateUserContext = (updatedUserData: Partial<User>) => {
    setUser(prevUser => {
      if (prevUser) {
        const newUser = { ...prevUser, ...updatedUserData };
        // Update localStorage
        localStorage.setItem('userData', JSON.stringify(newUser));
        return newUser;
      }
      return null;
    });
  };

  const refreshUserData = useCallback(async () => {
    if (token) {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        localStorage.setItem('userData', JSON.stringify(currentUser));
        console.log('✅ User data refreshed:', currentUser);
      } catch (error: any) {
        console.error('❌ Failed to refresh user data:', error);
        
        // Check if it's a 403 error for suspended account
        // Handle both axios error format and direct error format
        const isAccountDeactivated = 
          (error.response?.status === 403 && error.response?.data?.message === "Account is deactivated") ||
          (error.status === 403 && error.message === "Account is deactivated");
        
        if (isAccountDeactivated) {
          console.log('🔍 Detected account deactivation, updating user status');
          // For suspended accounts, we still want to keep the user data but update the is_active status
          // This will allow the SuspendedUserPopup to show
          if (user) {
            const updatedUser = { ...user, is_active: false };
            setUser(updatedUser);
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            localStorage.setItem('suspendedUser', JSON.stringify(updatedUser));
            console.log('✅ User marked as suspended, keeping session active');
          }
          // Don't logout the user, just update their status
          return;
        }
        
        // For other errors (like network issues), don't immediately logout
        // Keep the current user data to avoid disrupting the user experience
        console.log('⚠️ Keeping current user data due to refresh error');
        // Don't clear the session for temporary network issues
      }
    }
  }, [token, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        socketService.cleanup();
      } catch (error) {
        console.error('Error during socket cleanup:', error);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isOwner, isLoading, tokenExpired, login, logout, updateUserContext, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

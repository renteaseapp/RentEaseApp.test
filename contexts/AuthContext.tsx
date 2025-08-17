import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import { getCurrentUser } from '../services/userService';
import { socketService } from '../services/socketService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');
        const storedIsAdmin = localStorage.getItem('isAdmin');
        
        if (storedToken && storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            setToken(storedToken);
            setUser(userData);
            setIsAdmin(storedIsAdmin === 'true');
            setIsOwner(false); // Default to false, will be set based on user data structure
            
            // Connect to socket service with error handling
            try {
              socketService.connect(storedToken)
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
            await getCurrentUser().then(freshUserData => {
              setUser(freshUserData);
              localStorage.setItem('userData', JSON.stringify(freshUserData));
              console.log('✅ User data refreshed on session restore:', freshUserData);
            }).catch(refreshError => {
              console.error('❌ Failed to refresh user data on session restore:', refreshError);
              // If refresh fails, clear session to avoid stale data issues
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('isAdmin');
              setToken(null);
              setUser(null);
              setIsAdmin(false);
              setIsOwner(false);
            });

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

  const login = useCallback((token: string, userData: User, isAdminFlag: boolean) => {
    try {
      console.log('🔍 AuthContext.login called with:', { token: token ? 'present' : 'missing', userData, isAdminFlag });
      
      setToken(token);
      setUser(userData);
      setIsAdmin(isAdminFlag);
      setIsOwner(false); // Default to false, will be set based on user data structure
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
      } catch (error) {
        console.error('❌ Failed to refresh user data:', error);
      }
    }
  }, [token]);

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
    <AuthContext.Provider value={{ user, token, isAdmin, isOwner, isLoading, login, logout, updateUserContext, refreshUserData }}>
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

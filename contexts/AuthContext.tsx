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
          const res = await import('../services/ownerService');
          const dashboard = await res.getOwnerDashboardData(user.id);
          setIsOwner((dashboard.data.total_my_products || 0) > 0);
        } catch {
          setIsOwner(false);
        }
      } else {
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

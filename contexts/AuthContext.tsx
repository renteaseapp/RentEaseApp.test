import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { getCurrentUser } from '../services/userService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedIsAdmin = localStorage.getItem('isAdmin');
        if (storedToken) {
          setToken(storedToken);
          setIsAdmin(storedIsAdmin === 'true');
          // Fetch user profile from backend
          const userProfile = await getCurrentUser();
          setUser(userProfile);
        } else {
          setToken(null);
          setUser(null);
          setIsAdmin(false);
        }
      } catch (e) {
        // Token invalid or fetch failed
        setToken(null);
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('isAdmin');
      }
      setIsLoading(false);
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

  const login = (newToken: string, userData: User, isAdminFlag: boolean) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('isAdmin', String(isAdminFlag));
    setToken(newToken);
    setUser(userData);
    setIsAdmin(isAdminFlag);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdmin');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  const updateUserContext = (updatedUserData: Partial<User>) => {
    setUser(prevUser => {
      if (prevUser) {
        const newUser = { ...prevUser, ...updatedUserData };
        return newUser;
      }
      return null;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isOwner, isLoading, login, logout, updateUserContext }}>
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

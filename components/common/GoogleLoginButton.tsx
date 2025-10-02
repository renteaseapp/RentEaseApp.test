import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../ui/Button';
import { FaGoogle } from 'react-icons/fa';


interface GoogleLoginButtonProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  variant = 'outline',
  size = 'md',
  disabled = false,
  isLoading = false
}) => {

  const login = useGoogleLogin({
    onSuccess: (response) => {
      console.log('Google login success:', response);
      if (onSuccess) {
        onSuccess(response);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      if (onError) {
        onError(error);
      }
    },
    scope: 'email profile',
  });

  const handleGoogleLogin = () => {
    if (!disabled && !isLoading) {
      login();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full flex items-center justify-center gap-3 ${className}`}
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <FaGoogle className="h-4 w-4" />
      )}
      {isLoading ? 'กำลังโหลด...' : 'ดำเนินการต่อด้วย Google'}
    </Button>
  );
};

export default GoogleLoginButton; 
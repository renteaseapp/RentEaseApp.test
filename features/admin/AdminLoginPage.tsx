import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminLogin } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';

const LockClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const MailIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
</svg>
);

export const AdminLoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ email_or_username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminLogin(credentials);
      // Set admin-only localStorage
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('authUser', JSON.stringify(response.user));
      // Trigger context update
      auth.login(response.access_token, response.user, true);
      // Redirect to admin dashboard
      navigate(ROUTE_PATHS.ADMIN_DASHBOARD);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-2xl border border-blue-100">
          <CardContent className="p-10 sm:p-12">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-blue-600 rounded-full p-3 mb-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4v1a1 1 0 001 1h6a1 1 0 001-1v-1c0-2.21-1.79-4-4-4z" /></svg>
              </div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">Admin Login</h2>
              <p className="text-gray-500 text-sm mt-2">Sign in to manage the platform</p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} title="Error" />}
              <InputField
                label="Email or Username"
                id="email_or_username"
                name="email_or_username"
                type="text"
                autoComplete="username"
                required
                value={credentials.email_or_username}
                onChange={handleChange}
                placeholder="Enter your email or username"
                icon={<MailIcon />}
              />
              <InputField
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
                icon={<LockClosedIcon />}
              />
              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} fullWidth variant="primary" size="lg" className="shadow-md">
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                    Sign in as Admin
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage; 
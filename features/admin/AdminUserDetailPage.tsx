import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, ApiError, UserIdVerificationStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import {
  adminGetUserById,
  adminUpdateUser,
  adminBanUser,
  adminUnbanUser,
  adminDeleteUser,
  adminUpdateUserIdVerification
} from '../../services/adminService';

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const fetchUser = () => {
    if (userId) {
      setIsLoading(true);
      adminGetUserById(Number(userId))
        .then(setUserData)
        .catch((err: any) => setError((err as ApiError).message || "Failed to load user details."))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleBan = async () => {
    if (!userId) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      await adminBanUser(Number(userId));
      fetchUser();
    } catch (err: any) {
      setProcessError((err as ApiError).message || 'Failed to ban user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnban = async () => {
    if (!userId) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      await adminUnbanUser(Number(userId));
      fetchUser();
    } catch (err: any) {
      setProcessError((err as ApiError).message || 'Failed to unban user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIdVerification = async (status: UserIdVerificationStatus) => {
    if (!userId) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      await adminUpdateUserIdVerification(Number(userId), {
        id_verification_status: status,
        id_verified_at: new Date().toISOString(),
        id_verified_by_admin_id: 1 // TODO: ใช้ admin id จริงจาก context
      });
      fetchUser();
    } catch (err: any) {
      setProcessError((err as ApiError).message || 'Failed to update verification status.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading user details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!userData) return <div className="p-4 text-center">User not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">User Details: {userData.first_name} {userData.last_name} (@{userData.username})</h1>
      </div>
      <Card className="mb-6 border border-blue-50 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-700"><svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Account Information</h2>
          <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
            {userData.profile_picture_url && (
              <img src={userData.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover shadow-lg" />
            )}
            <div className="flex-1 space-y-1">
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Phone:</strong> {userData.phone_number || 'N/A'}</p>
              <p><strong>Status:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${userData.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{userData.is_active ? 'Active' : 'Inactive'}</span></p>
              <p><strong>Joined:</strong> {new Date(userData.created_at || Date.now()).toLocaleDateString()}</p>
              <p><strong>Last Login:</strong> {userData.last_login_at ? new Date(userData.last_login_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6 border border-blue-50 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-700"><svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg> ID Verification</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {userData.id_document_url && (
              <div>
                <div className="text-xs text-gray-500 mb-1">ID Document (Front)</div>
                <img src={userData.id_document_url} alt="ID Document Front" className="w-32 h-20 object-cover border rounded" />
              </div>
            )}
            {userData.id_document_back_url && (
              <div>
                <div className="text-xs text-gray-500 mb-1">ID Document (Back)</div>
                <img src={userData.id_document_back_url} alt="ID Document Back" className="w-32 h-20 object-cover border rounded" />
              </div>
            )}
            {userData.id_selfie_url && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Selfie with ID</div>
                <img src={userData.id_selfie_url} alt="Selfie with ID" className="w-20 h-20 object-cover border rounded-full" />
              </div>
            )}
          </div>
          <p><strong>Status:</strong> <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-800">{userData.id_verification_status?.replace(/_/g, ' ') || 'Not Submitted'}</span></p>
          {processError && <ErrorMessage message={processError} />}
          {userData.id_verification_status === UserIdVerificationStatus.PENDING && (
            <div className="mt-4 flex gap-2">
              <Button variant="primary" disabled={isProcessing} onClick={() => handleIdVerification('verified' as UserIdVerificationStatus)}>
                {isProcessing ? 'Processing...' : 'Verify ID'}
              </Button>
              <Button variant="danger" disabled={isProcessing} onClick={() => handleIdVerification(UserIdVerificationStatus.REJECTED)}>
                {isProcessing ? 'Processing...' : 'Reject ID'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border border-blue-50 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-700"><svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Admin Actions</h2>
          {processError && <ErrorMessage message={processError} />}
          <div className="flex gap-2 mb-2">
            {userData.is_active ? (
              <Button variant="danger" disabled={isProcessing} onClick={handleBan}>
                {isProcessing ? 'Processing...' : 'Ban User'}
              </Button>
            ) : (
              <Button variant="primary" disabled={isProcessing} onClick={handleUnban}>
                {isProcessing ? 'Processing...' : 'Unban User'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

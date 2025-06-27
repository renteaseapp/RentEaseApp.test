import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminGetUsers,
  adminBanUser,
  adminUnbanUser,
  adminDeleteUser
} from '../../services/adminService';
import { User, ApiError, PaginatedResponse, UserIdVerificationStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';

export const AdminManageUsersPage: React.FC = () => {
  const [usersResponse, setUsersResponse] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchUsers = (pageNum = 1) => {
    setIsLoading(true);
    adminGetUsers({ page: pageNum, limit: 20 })
      .then(setUsersResponse)
      .catch((err: any) => setError((err as ApiError).message || "Failed to load users."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleBan = async (user: User) => {
    if (!user.id) return;
    try {
      await adminBanUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError("Failed to ban user.");
    }
  };

  const handleUnban = async (user: User) => {
    if (!user.id) return;
    try {
      await adminUnbanUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError("Failed to unban user.");
    }
  };

  const handleDelete = async (user: User) => {
    if (!user.id) return;
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminDeleteUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError("Failed to delete user.");
    }
  };

  let users: User[] = usersResponse?.data || [];
  let hasPagination = !!usersResponse?.meta;

  if (isLoading && !usersResponse) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Manage Users</h1>
      </div>
      <div className="bg-white shadow-xl rounded-xl overflow-x-auto border border-blue-50">
        <table className="min-w-full divide-y divide-blue-100">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 4H8m8-8H8" /></svg> Email / Username</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg> Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> ID Verified</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-50">
            {users && users.length > 0 ? (
              users.map(user => (
                <tr key={user.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{user.email}</div>
                    <div className="text-xs text-gray-400">@{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {user.id_verification_status?.replace(/_/g, ' ') || 'Not Submitted'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link to={ROUTE_PATHS.ADMIN_USER_DETAIL.replace(':userId', String(user.id))} className="text-blue-600 hover:text-blue-900 font-bold underline underline-offset-2">View/Edit</Link>
                    {user.is_active ? (
                      <Button onClick={() => handleBan(user)} size="sm" variant="danger">Ban</Button>
                    ) : (
                      <Button onClick={() => handleUnban(user)} size="sm" variant="primary">Unban</Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasPagination && (
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span>Page {page}{usersResponse?.meta?.last_page ? ` / ${usersResponse.meta.last_page}` : ''}</span>
          <Button variant="outline" disabled={!!usersResponse && page >= (usersResponse.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

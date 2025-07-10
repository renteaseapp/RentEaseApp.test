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
import { useTranslation } from 'react-i18next';

export const AdminManageUsersPage: React.FC = () => {
  const { t } = useTranslation('adminManageUsersPage');
  const tRoot = useTranslation().t;
  const [usersResponse, setUsersResponse] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionRow, setActionRow] = useState<number | null>(null);

  const fetchUsers = (pageNum = 1) => {
    setIsLoading(true);
    adminGetUsers({ page: pageNum, limit: 20 })
      .then(setUsersResponse)
      .catch((err: any) => setError((err as ApiError).message || t('error.loadFailed')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line
  }, [page]);

  const handleBan = async (user: User) => {
    if (!user.id) return;
    try {
      await adminBanUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError(t('error.banFailed'));
    }
  };

  const handleUnban = async (user: User) => {
    if (!user.id) return;
    try {
      await adminUnbanUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError(t('error.unbanFailed'));
    }
  };

  const handleDelete = async (user: User) => {
    if (!user.id) return;
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await adminDeleteUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError(t('error.deleteFailed'));
    }
  };

  let users: User[] = usersResponse?.data || [];
  let hasPagination = !!usersResponse?.meta;

  // Client-side filter for now
  if (search) {
    users = users.filter(
      u =>
        (u.first_name && u.first_name.toLowerCase().includes(search.toLowerCase())) ||
        (u.last_name && u.last_name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(search.toLowerCase()))
    );
  }

  if (isLoading && !usersResponse) return <LoadingSpinner message={t('loadingUsers')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header + Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">{t('title')}</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            className="border border-blue-200 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder={t('searchPlaceholder') || 'Search by name or email...'}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
          />
          <Button onClick={() => setSearch(searchInput)} variant="primary">{t('actions.search') || 'Search'}</Button>
          {search && <Button onClick={() => { setSearch(''); setSearchInput(''); }} variant="outline">{t('actions.clear') || 'Clear'}</Button>}
        </div>
      </div>
      {/* Table Card */}
      <div className="bg-white shadow-xl rounded-xl overflow-x-auto border border-blue-50 p-2 md:p-4">
        <table className="min-w-full divide-y divide-blue-100 text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-blue-700 uppercase tracking-wider">{t('table.name')}</th>
              <th className="px-4 py-3 text-left font-bold text-blue-700 uppercase tracking-wider">{t('table.emailUsername')}</th>
              <th className="px-4 py-3 text-left font-bold text-blue-700 uppercase tracking-wider">{t('table.status')}</th>
              <th className="px-4 py-3 text-left font-bold text-blue-700 uppercase tracking-wider">{t('table.idVerified')}</th>
              <th className="px-4 py-3 text-left font-bold text-blue-700 uppercase tracking-wider">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-50">
            {users && users.length > 0 ? (
              users.map(user => (
                <tr key={user.id} className="hover:bg-blue-50 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    <div>{user.email}</div>
                    <div className="text-xs text-gray-400">@{user.username}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {user.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700 text-center">
                    {user.id_verification_status ? tRoot(`idVerification.${user.id_verification_status}`) : tRoot('idVerification.not_submitted')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium relative">
                    <div className="relative inline-block text-left">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionRow(actionRow === user.id ? null : user.id)}
                        className="min-w-[2.5rem]"
                      >
                        <span className="sr-only">Actions</span>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="19.5" cy="12" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/></svg>
                      </Button>
                      {actionRow === user.id && (
                        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                          <div className="py-1">
                            <Link to={ROUTE_PATHS.ADMIN_USER_DETAIL.replace(':userId', String(user.id))} className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50" onClick={() => setActionRow(null)}>{t('actions.viewEdit')}</Link>
                            {user.is_active ? (
                              <button onClick={() => { handleBan(user); setActionRow(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-blue-50">{t('actions.ban')}</button>
                            ) : (
                              <button onClick={() => { handleUnban(user); setActionRow(null); }} className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-blue-50">{t('actions.unban')}</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  {t('noUsersFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasPagination && (
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('pagination.prev')}</Button>
          <span>{t('pagination.page')} {page}{usersResponse?.meta?.last_page ? ` / ${usersResponse.meta.last_page}` : ''}</span>
          <Button variant="outline" disabled={!!usersResponse && page >= (usersResponse.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>{t('pagination.next')}</Button>
        </div>
      )}
    </div>
  );
};

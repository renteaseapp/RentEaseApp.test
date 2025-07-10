import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetProducts, adminApproveProduct } from '../../services/adminService';
import { Product, ApiError, PaginatedResponse, ProductAdminApprovalStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';

export const AdminManageProductsPage: React.FC = () => {
  const { t } = useTranslation('adminManageProductsPage');
  const [productsResponse, setProductsResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionRow, setActionRow] = useState<number | null>(null);

  const fetchProducts = (pageNum = 1) => {
    setIsLoading(true);
    adminGetProducts({ page: pageNum, limit: 20 })
      .then(setProductsResponse)
      .catch(err => setError((err as ApiError).message || t('error.loadFailed')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line
  }, [page]);

  const handleApproval = async (productId: number, status: ProductAdminApprovalStatus) => {
    try {
      await adminApproveProduct(productId, {
        admin_approval_status: status,
        approved_by_admin_id: 1 // TODO: ใช้ admin id จาก context
      });
      fetchProducts(page);
    } catch (err) {
      setError(t('error.updateApprovalFailed'));
    }
  };

  let products: Product[] = productsResponse?.data || [];
  // Client-side filter for now
  if (search) {
    products = products.filter(
      p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        String(p.owner_id).includes(search)
    );
  }
  let hasPagination = !!productsResponse?.meta;

  if (isLoading && !productsResponse) return <LoadingSpinner message={t('loadingProducts')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header + Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">{t('title')}</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            className="border border-green-200 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder={t('searchPlaceholder') || 'Search by title or owner ID...'}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
          />
          <Button onClick={() => setSearch(searchInput)} variant="primary">{t('actions.search') || 'Search'}</Button>
          {search && <Button onClick={() => { setSearch(''); setSearchInput(''); }} variant="outline">{t('actions.clear') || 'Clear'}</Button>}
        </div>
      </div>
      {/* Table Card */}
      <div className="bg-white shadow-xl rounded-xl overflow-x-auto border border-green-50 p-2 md:p-4">
        <table className="min-w-full divide-y divide-green-100 text-sm">
          <thead className="bg-green-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-green-700 uppercase tracking-wider">{t('table.title')}</th>
              <th className="px-4 py-3 text-left font-bold text-green-700 uppercase tracking-wider">{t('table.ownerId')}</th>
              <th className="px-4 py-3 text-left font-bold text-green-700 uppercase tracking-wider">{t('table.pricePerDay')}</th>
              <th className="px-4 py-3 text-left font-bold text-green-700 uppercase tracking-wider">{t('table.approvalStatus')}</th>
              <th className="px-4 py-3 text-left font-bold text-green-700 uppercase tracking-wider">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-green-50">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-green-50 transition-colors group">
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{product.title}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">{product.owner_id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">฿{product.rental_price_per_day}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                    product.admin_approval_status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                    product.admin_approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-red-100 text-red-800 border-red-200'}`}>
                    {t(`approvalStatus.${product.admin_approval_status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-medium relative">
                  <div className="relative inline-block text-left">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionRow(actionRow === product.id ? null : product.id)}
                      className="min-w-[2.5rem]"
                    >
                      <span className="sr-only">Actions</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="19.5" cy="12" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/></svg>
                    </Button>
                    {actionRow === product.id && (
                      <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <Link to={ROUTE_PATHS.ADMIN_PRODUCT_DETAIL.replace(':productId', String(product.id))} className="block px-4 py-2 text-sm text-green-700 hover:bg-green-50" onClick={() => setActionRow(null)}>{t('actions.viewEdit')}</Link>
                          {product.admin_approval_status === 'pending' && (
                            <>
                              <button onClick={() => { handleApproval(product.id, 'approved' as ProductAdminApprovalStatus); setActionRow(null); }} className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50">{t('actions.approve')}</button>
                              <button onClick={() => { handleApproval(product.id, 'rejected' as ProductAdminApprovalStatus); setActionRow(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-green-50">{t('actions.reject')}</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasPagination && (
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('pagination.prev')}</Button>
          <span>{t('pagination.page')} {page}{productsResponse?.meta?.last_page ? ` / ${productsResponse.meta.last_page}` : ''}</span>
          <Button variant="outline" disabled={!!productsResponse && page >= (productsResponse.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>{t('pagination.next')}</Button>
        </div>
      )}
    </div>
  );
};

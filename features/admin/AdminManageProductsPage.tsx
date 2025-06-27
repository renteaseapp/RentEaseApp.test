import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetProducts, adminApproveProduct } from '../../services/adminService';
import { Product, ApiError, PaginatedResponse, ProductAdminApprovalStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';

export const AdminManageProductsPage: React.FC = () => {
  const [productsResponse, setProductsResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchProducts = (pageNum = 1) => {
    setIsLoading(true);
    adminGetProducts({ page: pageNum, limit: 20 })
      .then(setProductsResponse)
      .catch(err => setError((err as ApiError).message || "Failed to load products."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const handleApproval = async (productId: number, status: ProductAdminApprovalStatus) => {
    try {
      await adminApproveProduct(productId, {
        admin_approval_status: status,
        approved_by_admin_id: 1 // TODO: ใช้ admin id จริงจาก context
      });
      fetchProducts(page);
    } catch (err) {
      setError("Failed to update product approval status.");
    }
  };

  let products: Product[] = productsResponse?.data || [];
  let hasPagination = !!productsResponse?.meta;

  if (isLoading && !productsResponse) return <LoadingSpinner message="Loading products..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Manage Products</h1>
      </div>
      <div className="bg-white shadow-xl rounded-xl overflow-x-auto border border-green-50">
        <table className="min-w-full divide-y divide-green-100">
          <thead className="bg-green-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg> Title</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg> Owner ID</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /></svg> Price/Day</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1"><svg className="h-4 w-4 inline text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Approval Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-green-50">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-green-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.owner_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">฿{product.rental_price_per_day}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                    product.admin_approval_status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                    product.admin_approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-red-100 text-red-800 border-red-200'}`}>
                    {product.admin_approval_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link to={ROUTE_PATHS.ADMIN_PRODUCT_DETAIL.replace(':productId', String(product.id))} className="text-green-700 hover:text-green-900 font-bold underline underline-offset-2">View/Edit</Link>
                  {product.admin_approval_status === 'pending' && (
                    <>
                      <Button onClick={() => handleApproval(product.id, 'approved' as ProductAdminApprovalStatus)} size="sm" variant="primary">Approve</Button>
                      <Button onClick={() => handleApproval(product.id, 'rejected' as ProductAdminApprovalStatus)} size="sm" variant="danger">Reject</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasPagination && (
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span>Page {page}{productsResponse?.meta?.last_page ? ` / ${productsResponse.meta.last_page}` : ''}</span>
          <Button variant="outline" disabled={!!productsResponse && page >= (productsResponse.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

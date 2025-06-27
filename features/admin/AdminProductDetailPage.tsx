import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetProducts, adminApproveProduct } from '../../services/adminService';
import { Product, ApiError, ProductAdminApprovalStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { Button } from '../../components/ui/Button';

export const AdminProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const fetchProduct = () => {
    if (productId) {
      setIsLoading(true);
      adminGetProducts({ page: 1, limit: 100 })
        .then(res => {
          const found = res.data.find(p => String(p.id) === productId);
          setProduct(found || null);
          setApprovalStatus(found?.admin_approval_status || '');
          setApprovalNotes((found as any)?.admin_approval_notes || '');
        })
        .catch(err => setError((err as ApiError).message || "Failed to load product details."))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleApprove = async (status: ProductAdminApprovalStatus) => {
    if (!productId) return;
    setIsSubmitting(true);
    try {
      await adminApproveProduct(Number(productId), {
        admin_approval_status: status,
        admin_approval_notes: approvalNotes,
        approved_by_admin_id: 1 // TODO: ใช้ admin id จริงจาก context
      });
      fetchProduct();
    } catch (err) {
      setError('Failed to update approval status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading product details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <div className="p-4 text-center">Product not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Admin View: {product.title}</h1>
      </div>
      <Card className="mb-6 border border-green-50 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-green-700"><svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg> Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p><strong>Owner ID:</strong> {product.owner_id}</p>
              <p><strong>Category:</strong> {product.category_id}</p>
              <p><strong>Province:</strong> {product.province_id}</p>
              <p><strong>Price/Day:</strong> <span className="text-green-700 font-bold">฿{product.rental_price_per_day}</span></p>
              <p><strong>Availability:</strong> <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-green-200 bg-green-50 text-green-800">{product.availability_status?.toUpperCase()}</span></p>
              <p><strong>Admin Approval:</strong> <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                product.admin_approval_status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                product.admin_approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'}`}>{product.admin_approval_status?.toUpperCase()}</span></p>
            </div>
            <div>
              <p><strong>Description:</strong></p>
              <div className="bg-gray-50 rounded p-3 text-gray-700 text-sm min-h-[60px]">{product.description || "N/A"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-green-50 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-green-700"><svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Admin Actions</h2>
          <div className="mb-4">
            <label className="block font-medium mb-1">Approval Notes</label>
            <textarea className="w-full border rounded p-2" rows={2} value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" disabled={isSubmitting} onClick={() => handleApprove('approved' as ProductAdminApprovalStatus)}>
              {isSubmitting ? 'Processing...' : 'Approve'}
            </Button>
            <Button variant="danger" disabled={isSubmitting} onClick={() => handleApprove('rejected' as ProductAdminApprovalStatus)}>
              {isSubmitting ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

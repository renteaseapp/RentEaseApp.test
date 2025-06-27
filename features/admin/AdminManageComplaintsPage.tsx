import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Complaint, ApiError, PaginatedResponse } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { adminGetComplaints } from '../../services/adminService';

export const AdminManageComplaintsPage: React.FC = () => {
  const [complaintsResponse, setComplaintsResponse] = useState<PaginatedResponse<Complaint> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchComplaints = (pageNum = 1) => {
    setIsLoading(true);
    adminGetComplaints({ page: pageNum, limit: 20 })
      .then(setComplaintsResponse)
      .catch((err: any) => setError((err as ApiError).message || "Failed to load complaints."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchComplaints(page);
  }, [page]);

  let complaints: Complaint[] = complaintsResponse?.data || [];
  let hasPagination = !!complaintsResponse?.meta;

  if (isLoading && !complaintsResponse) return <LoadingSpinner message="Loading complaints..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Complaints</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complainant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.map(complaint => (
              <tr key={complaint.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{complaint.complaint_uid?.substring(0,8) || complaint.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.complainant_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.complaint_type.replace(/_/g,' ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    {complaint.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={ROUTE_PATHS.ADMIN_COMPLAINT_DETAIL.replace(':complaintId', String(complaint.id))} className="text-blue-600 hover:text-blue-900">View/Resolve</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasPagination && (
        <div className="flex justify-between items-center mt-4">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page}{complaintsResponse?.meta?.last_page ? ` / ${complaintsResponse.meta.last_page}` : ''}</span>
          <button className="btn btn-outline" disabled={!!complaintsResponse && page >= (complaintsResponse.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

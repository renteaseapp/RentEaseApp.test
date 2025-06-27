import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Complaint, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { adminGetComplaintById, adminReplyComplaint } from '../../services/adminService';

export const AdminComplaintDetailPage: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchComplaint = () => {
    if (complaintId) {
      setIsLoading(true);
      adminGetComplaintById(Number(complaintId))
        .then(data => {
          setComplaint(data);
          setStatus(data.status);
          setAdminNotes((data as any).admin_notes || '');
          setResolutionNotes((data as any).resolution_notes || '');
        })
        .catch((err: any) => setError((err as ApiError).message || "Failed to load complaint details."))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await adminReplyComplaint(Number(complaintId), {
        status,
        admin_notes: adminNotes,
        resolution_notes: resolutionNotes,
        admin_handler_id: 1 // TODO: ใช้ admin id จริงจาก context
      });
      fetchComplaint();
    } catch (err: any) {
      setSubmitError((err as ApiError).message || 'Failed to update complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading complaint details for admin..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!complaint) return <div className="p-4 text-center">Complaint not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Admin View: Complaint {complaint.complaint_uid?.substring(0,8) || complaint.id}</h1>
      </div>
      <Card className="mb-6 border border-red-100 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-red-700"><svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg> {complaint.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p><strong>Complainant ID:</strong> {complaint.complainant_id}</p>
              <p><strong>Type:</strong> {complaint.complaint_type.replace(/_/g,' ').toUpperCase()}</p>
              <p><strong>Status:</strong> <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-red-200 bg-red-50 text-red-800">{complaint.status.replace(/_/g, ' ').toUpperCase()}</span></p>
              <p><strong>Date Submitted:</strong> {new Date(complaint.created_at).toLocaleString()}</p>
              {complaint.subject_user_id && <p><strong>Subject User ID:</strong> {complaint.subject_user_id}</p>}
              {complaint.related_product_id && <p><strong>Related Product ID:</strong> {complaint.related_product_id}</p>}
              {complaint.related_rental_id && <p><strong>Related Rental ID:</strong> {complaint.related_rental_id}</p>}
            </div>
            <div>
              <h3 className="font-semibold">Complaint Details:</h3>
              <div className="bg-gray-50 rounded p-3 text-gray-700 text-sm min-h-[60px] whitespace-pre-wrap">{complaint.details}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-red-100 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-red-700"><svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Admin Actions & Resolution</h2>
          {submitError && <ErrorMessage message={submitError} />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Admin Notes</label>
              <textarea className="w-full border rounded p-2" rows={2} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Resolution Notes</label>
              <textarea className="w-full border rounded p-2" rows={2} value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Status</label>
              <select className="w-full border rounded p-2" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="awaiting_user_response">Awaiting User Response</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed_no_action">Closed No Action</option>
                <option value="closed_escalated_to_claim">Closed Escalated To Claim</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

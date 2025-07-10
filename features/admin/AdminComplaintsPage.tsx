import React, { useEffect, useState } from 'react';
import { adminGetComplaints, adminGetComplaintById, adminReplyComplaint } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/Card';

const STATUS_OPTIONS = [
  'submitted',
  'under_review',
  'awaiting_user_response',
  'investigating',
  'resolved',
  'closed_no_action',
  'closed_escalated_to_claim',
];

function AdminComplaintsPage() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [replyForm, setReplyForm] = useState({
    status: '',
    admin_notes: '',
    resolution_notes: '',
  });
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Fetch complaints list
  useEffect(() => {
    setLoading(true);
    setError(null);
    adminGetComplaints({ page, limit })
      .then((res: any) => {
        // API returns { data: [...], meta: {...} }
        setComplaints(res.data || []);
        setTotal(Number(res.meta?.total) || 0);
        setLoading(false);
      })
      .catch(() => {
        setError(t('adminComplaints.error.loadList'));
        setLoading(false);
      });
  }, [page, limit, t]);

  // Fetch complaint details
  const handleSelectComplaint = (id: number) => {
    setLoading(true);
    setSelectedComplaint(null);
    adminGetComplaintById(id)
      .then((data: any) => {
        setSelectedComplaint(data);
        setReplyForm({
          status: data.status || '',
          admin_notes: data.admin_notes || '',
          resolution_notes: data.resolution_notes || '',
        });
        setLoading(false);
      })
      .catch(() => {
        setError(t('adminComplaints.error.loadDetail'));
        setLoading(false);
      });
  };

  // Handle reply/update
  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setReplyLoading(true);
    setReplyError(null);
    try {
      const updated = await adminReplyComplaint(selectedComplaint.id, replyForm);
      setSelectedComplaint(updated);
      // Update list
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setReplyError(t('adminComplaints.error.reply'));
    } finally {
      setReplyLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight flex items-center gap-3">
          <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg>
          {t('adminComplaints.title')}
        </h1>
        {totalPages > 1 && (
          <div className="flex gap-2 items-center mt-2 md:mt-0">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="sm">{t('adminComplaints.prev')}</Button>
            <span className="text-gray-500 font-semibold">{page} / {totalPages}</span>
            <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outline" size="sm">{t('adminComplaints.next')}</Button>
          </div>
        )}
      </div>
      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner />}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-400 py-16 text-lg font-medium bg-white rounded-xl shadow border border-blue-50">{t('adminComplaints.noComplaints')}</div>
        )}
        {complaints.map((c) => (
          <Card
            key={c.id}
            className={`transition-shadow duration-200 border-2 ${selectedComplaint?.id === c.id ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-blue-50 hover:border-blue-300 hover:shadow-xl'} cursor-pointer group`}
            onClick={() => handleSelectComplaint(c.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    c.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                    c.status === 'closed_no_action' ? 'bg-gray-200 text-gray-600' :
                    c.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    c.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>{t(`adminComplaints.status.${c.status}`)}</span>
                  <span className="text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">ID: {c.complaint_uid}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 truncate group-hover:text-blue-700 transition-colors">{c.title}</h3>
              <div className="text-sm text-gray-600 mb-2 truncate">{c.details}</div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">{t('adminComplaints.type')}: {t(`adminComplaints.type.${c.complaint_type}`)}</span>
                {c.related_rental_id && <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">{t('adminComplaints.rental')}: {c.related_rental_id}</span>}
                {c.related_product_id && <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">{t('adminComplaints.product')}: {c.related_product_id}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Complaint Details Side Panel/Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-2xl mx-4 relative animate-fadeIn">
            <Card className="rounded-2xl shadow-2xl border border-blue-100">
              <CardContent className="p-6 md:p-10 overflow-y-auto max-h-[90vh]">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
                  onClick={() => setSelectedComplaint(null)}
                  aria-label={t('adminComplaints.close')}
                  style={{ right: 24, top: 24 }}
                >
                  &times;
                </button>
                <h3 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                  <svg className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg>
                  {t('adminComplaints.detailTitle')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">{t(`adminComplaints.status.${selectedComplaint.status}`)}</span>
                      <span className="text-gray-400 text-xs">{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                      <span className="text-sm text-gray-500">ID: {selectedComplaint.complaint_uid}</span>
                    </div>
                    <div><b>{t('adminComplaints.title')}:</b> {selectedComplaint.title}</div>
                    <div><b>{t('adminComplaints.type')}:</b> {t(`adminComplaints.type.${selectedComplaint.complaint_type}`)}</div>
                    <div><b>{t('adminComplaints.details')}:</b> {selectedComplaint.details}</div>
                    <div><b>{t('adminComplaints.adminNotes')}:</b> {selectedComplaint.admin_notes || '-'}</div>
                    <div><b>{t('adminComplaints.resolutionNotes')}:</b> {selectedComplaint.resolution_notes || '-'}</div>
                  </div>
                  <div className="space-y-2">
                    <div><b>{t('adminComplaints.rental')}:</b> {selectedComplaint.related_rental_id || '-'}</div>
                    <div><b>{t('adminComplaints.product')}:</b> {selectedComplaint.related_product_id || '-'}</div>
                    <div><b>{t('adminComplaints.user')}:</b> {selectedComplaint.subject_user_id || '-'}</div>
                    <div><b>{t('adminComplaints.priority')}:</b> {selectedComplaint.priority || '-'}</div>
                    <div><b>{t('adminComplaints.attachments')}:</b> {selectedComplaint.complaint_attachments && selectedComplaint.complaint_attachments.length > 0 ? (
                      <ul className="list-disc ml-6">
                        {selectedComplaint.complaint_attachments.map((a: any) => (
                          <li key={a.id}><a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{a.description || a.file_url}</a></li>
                        ))}
                      </ul>
                    ) : t('adminComplaints.none')}
                    </div>
                  </div>
                </div>
                {/* Reply/Update Form */}
                <form onSubmit={handleReplySubmit} className="space-y-4 border-t pt-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">{t('adminComplaints.statusLabel')}</label>
                      <select
                        className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={replyForm.status}
                        onChange={e => setReplyForm(f => ({ ...f, status: e.target.value }))}
                        required
                      >
                        <option value="">{t('adminComplaints.statusSelect')}</option>
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{t(`adminComplaints.status.${opt}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">{t('adminComplaints.adminNotes')}</label>
                      <textarea
                        className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={replyForm.admin_notes}
                        onChange={e => setReplyForm(f => ({ ...f, admin_notes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">{t('adminComplaints.resolutionNotes')}</label>
                    <textarea
                      className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={replyForm.resolution_notes}
                      onChange={e => setReplyForm(f => ({ ...f, resolution_notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  {replyError && <ErrorMessage message={replyError} />}
                  <div className="flex flex-col md:flex-row gap-3 mt-2">
                    <Button type="submit" variant="primary" size="md" className="w-full md:w-auto">{replyLoading ? t('adminComplaints.saving') : t('adminComplaints.save')}</Button>
                    <Button type="button" variant="ghost" size="md" className="w-full md:w-auto" onClick={() => setSelectedComplaint(null)}>{t('adminComplaints.close')}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaintsPage; 
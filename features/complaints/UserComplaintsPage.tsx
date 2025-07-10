import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Textarea } from '../../components/ui/Textarea';
import { API_BASE_URL } from '../../constants';
import { useTranslation } from 'react-i18next';
import { getMyRentals } from '../../services/rentalService';

// Complaint types could be fetched from API or defined here
const COMPLAINT_TYPES = [
  { value: 'user_behavior', label: 'complaints.type.user_behavior' },
  { value: 'wrong_item', label: 'complaints.type.wrong_item' },
  { value: 'ระเบิด', label: 'complaints.type.explosive' },
];

function UserComplaintsPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    details: '',
    complaint_type: '',
    related_rental_id: '',
    related_product_id: '',
    subject_user_id: '',
    attachments: [] as File[],
  });
  const [newUpdate, setNewUpdate] = useState({ message: '', attachments: [] as File[] });
  const [submitting, setSubmitting] = useState(false);
  const [rentalOptions, setRentalOptions] = useState<any[]>([]);

  // Fetch complaints list
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/complaints/my?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setComplaints(data?.data?.data?.items || []);
        setLoading(false);
      })
      .catch(() => {
        setError(t('complaints.error.loadList'));
        setLoading(false);
      });
  }, [token, t]);

  // Fetch rental options when form is opened
  useEffect(() => {
    if (!showNewForm || !token) return;
    getMyRentals({ page: 1, limit: 50 })
      .then(res => setRentalOptions(res.data))
      .catch(() => setRentalOptions([]));
  }, [showNewForm, token]);

  // Fetch complaint details
  const handleSelectComplaint = (id: number) => {
    setLoading(true);
    setSelectedComplaint(null);
    fetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setSelectedComplaint(data?.data?.data || null);
        setLoading(false);
      })
      .catch(() => {
        setError(t('complaints.error.loadDetail'));
        setLoading(false);
      });
  };

  // Create new complaint
  const handleNewComplaintSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('title', newComplaint.title);
    formData.append('details', newComplaint.details);
    formData.append('complaint_type', newComplaint.complaint_type);
    if (newComplaint.related_rental_id) formData.append('related_rental_id', newComplaint.related_rental_id);
    if (newComplaint.related_product_id) formData.append('related_product_id', newComplaint.related_product_id);
    if (newComplaint.subject_user_id) formData.append('subject_user_id', newComplaint.subject_user_id);
    newComplaint.attachments.forEach(file => formData.append('attachments', file));
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to create complaint');
      setShowNewForm(false);
      setNewComplaint({ title: '', details: '', complaint_type: '', related_rental_id: '', related_product_id: '', subject_user_id: '', attachments: [] });
      const data = await res.json();
      setComplaints((prev) => [data.data.data, ...prev]);
    } catch (err) {
      setError(t('complaints.error.create'));
    } finally {
      setSubmitting(false);
    }
  };

  // Add update/message to complaint
  const handleAddUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!newUpdate.message.trim()) {
      setError(t('complaints.error.messageRequired'));
      return;
    }
    if (newUpdate.attachments.length === 0) {
      setError(t('complaints.error.attachmentRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('message', newUpdate.message.trim());
    newUpdate.attachments.forEach(file => formData.append('attachments', file));
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${selectedComplaint.id}/updates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to add update');
      handleSelectComplaint(selectedComplaint.id);
      setNewUpdate({ message: '', attachments: [] });
    } catch (err) {
      setError(t('complaints.error.addUpdate'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight flex items-center gap-3">
          <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg>
          {t('complaints.title')}
        </h1>
        <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary" size="md">
          {showNewForm ? t('complaints.cancel') : t('complaints.newComplaint')}
        </Button>
      </div>
      {showNewForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">{t('complaints.submitNewTitle')}</h2>
          <form onSubmit={handleNewComplaintSubmit} className="space-y-4">
            <InputField
              label={t('complaints.form.title')}
              value={newComplaint.title}
              onChange={e => setNewComplaint({ ...newComplaint, title: e.target.value })}
              required
            />
            <Textarea
              label={t('complaints.form.details')}
              value={newComplaint.details}
              onChange={e => setNewComplaint({ ...newComplaint, details: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('complaints.form.type')}</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={newComplaint.complaint_type}
                onChange={e => setNewComplaint({ ...newComplaint, complaint_type: e.target.value })}
                required
              >
                <option value="">{t('complaints.form.typeSelect')}</option>
                {COMPLAINT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{t(type.label)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('complaints.form.rental')}</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newComplaint.related_rental_id}
                  onChange={e => {
                    const rentalId = e.target.value;
                    const rental = rentalOptions.find(r => String(r.id) === rentalId);
                    setNewComplaint(prev => ({
                      ...prev,
                      related_rental_id: rentalId,
                      related_product_id: rentalId && rental?.product_id ? String(rental.product_id) : '',
                      subject_user_id: rentalId && rental?.owner_id ? String(rental.owner_id) : '',
                    }));
                  }}
                >
                  <option value="">{t('complaints.form.noSelect')}</option>
                  {rentalOptions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.id} - {r.product?.title || t('complaints.none')}
                    </option>
                  ))}
                </select>
              </div>
              <InputField
                label={t('complaints.form.product')}
                value={newComplaint.related_product_id}
                onChange={e => setNewComplaint({ ...newComplaint, related_product_id: e.target.value })}
                type="number"
              />
              <InputField
                label={t('complaints.form.user')}
                value={newComplaint.subject_user_id}
                onChange={e => setNewComplaint({ ...newComplaint, subject_user_id: e.target.value })}
                type="number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('complaints.form.attachments')}</label>
              <input
                type="file"
                multiple
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => setNewComplaint({ ...newComplaint, attachments: e.target.files ? Array.from(e.target.files) : [] })}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} variant="primary" size="md">
                {submitting ? t('complaints.submitting') : t('complaints.submitComplaint')}
              </Button>
            </div>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-16 text-lg font-medium bg-white rounded-xl shadow border border-blue-50">{t('complaints.noComplaints')}</div>
        )}
        {complaints.map(c => (
          <div
            key={c.id}
            className={`bg-white rounded-xl shadow-md p-6 border-2 transition transform duration-200 cursor-pointer group ${selectedComplaint?.id === c.id ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-blue-50 hover:border-blue-300 hover:shadow-xl'}`}
            onClick={() => handleSelectComplaint(c.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${c.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : c.status === 'closed_no_action' ? 'bg-gray-200 text-gray-600' : c.status === 'resolved' ? 'bg-green-100 text-green-800' : c.status === 'under_review' ? 'bg-blue-100 text-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{t(`complaints.status.${c.status}`)}</span>
                <span className="text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">ID: {c.complaint_uid}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 truncate group-hover:text-blue-700 transition-colors">{c.title}</h3>
            <div className="text-sm text-gray-600 mb-2 truncate">{c.details}</div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">{t('complaints.form.type')}: {t(`complaints.type.${c.complaint_type}`)}</span>
              {c.related_rental_id && <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">{t('complaints.form.rental')}: {c.related_rental_id}</span>}
              {c.related_product_id && <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">{t('complaints.form.product')}: {c.related_product_id}</span>}
            </div>
          </div>
        ))}
      </div>
      {/* Complaint Details Side Panel/Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-8 relative animate-fadeIn">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
              onClick={() => setSelectedComplaint(null)}
              aria-label={t('complaints.close')}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold text-blue-700 mb-2">{t('complaints.detailTitle')}</h3>
            <div className="mb-4">
              <div className="flex flex-wrap gap-4 mb-2">
                <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">{t(`complaints.status.${selectedComplaint.status}`)}</span>
                <span className="text-gray-400 text-xs">{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                <span className="text-sm text-gray-500">ID: {selectedComplaint.complaint_uid}</span>
              </div>
              <div className="mb-2"><b>{t('complaints.form.title')}:</b> {selectedComplaint.title}</div>
              <div className="mb-2"><b>{t('complaints.form.type')}:</b> {t(`complaints.type.${selectedComplaint.complaint_type}`)}</div>
              <div className="mb-2"><b>{t('complaints.form.details')}:</b> {selectedComplaint.details}</div>
              <div className="mb-2"><b>{t('complaints.adminNotes')}:</b> {selectedComplaint.admin_notes || '-'}</div>
              <div className="mb-2"><b>{t('complaints.resolutionNotes')}:</b> {selectedComplaint.resolution_notes || '-'}</div>
              <div className="mb-2"><b>{t('complaints.form.attachments')}:</b> {selectedComplaint.complaint_attachments && selectedComplaint.complaint_attachments.length > 0 ? (
                <ul className="list-disc ml-6">
                  {selectedComplaint.complaint_attachments.map((a: any) => (
                    <li key={a.id}><a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{a.description || a.file_url}</a></li>
                  ))}
                </ul>
              ) : t('complaints.none')}
              </div>
              <div className="mb-2"><b>{t('complaints.form.rental')}:</b> {selectedComplaint.related_rental_id}</div>
              <div className="mb-2"><b>{t('complaints.form.product')}:</b> {selectedComplaint.related_product_id}</div>
              <div className="mb-2"><b>{t('complaints.form.user')}:</b> {selectedComplaint.subject_user_id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserComplaintsPage; 
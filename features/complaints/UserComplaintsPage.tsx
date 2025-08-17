import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { API_BASE_URL } from '../../constants';
import { useTranslation } from 'react-i18next';
import { getMyRentals } from '../../services/rentalService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaExclamationTriangle, 
  FaPlus, 
  FaTimes, 
  FaPaperclip, 
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaFileAlt,
  FaDownload,
  FaArrowRight,
  FaShieldAlt,
  FaUser,
  FaBox,
  FaCalendarAlt,
  FaTag
} from 'react-icons/fa';

// Complaint types could be fetched from API or defined here
const COMPLAINT_TYPES = [
  { value: 'user_behavior', label: 'complaints.type.user_behavior', icon: <FaUser className="h-4 w-4" /> },
  { value: 'wrong_item', label: 'complaints.type.wrong_item', icon: <FaBox className="h-4 w-4" /> },
  { value: 'ระเบิด', label: 'complaints.type.explosive', icon: <FaExclamationTriangle className="h-4 w-4" /> },
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
  const [] = useState({ message: '', attachments: [] as File[] });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FaClock className="h-4 w-4" />;
      case 'under_review':
        return <FaSpinner className="h-4 w-4" />;
      case 'resolved':
        return <FaCheckCircle className="h-4 w-4" />;
      case 'closed_no_action':
        return <FaTimesCircle className="h-4 w-4" />;
      default:
        return <FaExclamationTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed_no_action':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 pt-16">
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-4 shadow-lg">
            <FaShieldAlt className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            {t('complaints.title')}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Report issues and get support for your rental experiences
          </p>
        </motion.div>

        {/* New Complaint Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewForm(!showNewForm)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {showNewForm ? (
              <>
                <FaTimes className="h-5 w-5" />
                {t('complaints.cancel')}
              </>
            ) : (
              <>
                <FaPlus className="h-5 w-5" />
                {t('complaints.newComplaint')}
                <FaArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* New Complaint Form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{t('complaints.submitNewTitle')}</h2>
              </div>
              
              <form onSubmit={handleNewComplaintSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('complaints.form.title')}
                    </label>
                    <input
                      type="text"
                      value={newComplaint.title}
                      onChange={e => setNewComplaint({ ...newComplaint, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('complaints.form.type')}
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={newComplaint.complaint_type}
                      onChange={e => setNewComplaint({ ...newComplaint, complaint_type: e.target.value })}
                      required
                    >
                      <option value="">{t('complaints.form.typeSelect')}</option>
                      {COMPLAINT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {t(type.label)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('complaints.form.details')}
                  </label>
                  <textarea
                    value={newComplaint.details}
                    onChange={e => setNewComplaint({ ...newComplaint, details: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('complaints.form.rental')}
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('complaints.form.product')}
                    </label>
                    <input
                      type="number"
                      value={newComplaint.related_product_id}
                      onChange={e => setNewComplaint({ ...newComplaint, related_product_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('complaints.form.user')}
                    </label>
                    <input
                      type="number"
                      value={newComplaint.subject_user_id}
                      onChange={e => setNewComplaint({ ...newComplaint, subject_user_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('complaints.form.attachments')}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={e => setNewComplaint({ ...newComplaint, attachments: e.target.files ? Array.from(e.target.files) : [] })}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FaPaperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload files or drag and drop</p>
                      <p className="text-sm text-gray-400 mt-1">Support for images, PDFs, and documents</p>
                    </label>
                  </div>
                  {newComplaint.attachments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected files: {newComplaint.attachments.length}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('complaints.submitting')}
                      </>
                    ) : (
                      <>
                        <FaExclamationTriangle className="h-4 w-4" />
                        {t('complaints.submitComplaint')}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complaints Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {complaints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-6">
                  <FaCheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {t('complaints.noComplaints')}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Great! You have no complaints to report. Keep enjoying your rental experience.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {complaints.map((complaint, index) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`bg-white rounded-2xl shadow-lg border-2 p-6 cursor-pointer transition-all duration-300 group ${
                      selectedComplaint?.id === complaint.id 
                        ? 'border-red-500 shadow-2xl scale-[1.02]' 
                        : 'border-gray-100 hover:border-red-300 hover:shadow-xl'
                    }`}
                    onClick={() => handleSelectComplaint(complaint.id)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          {t(`complaints.status.${complaint.status}`)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">#{complaint.complaint_uid}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {complaint.title}
                    </h3>

                    {/* Details */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {complaint.details}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                        <FaTag className="h-3 w-3" />
                        {t(`complaints.type.${complaint.complaint_type}`)}
                      </span>
                      {complaint.related_rental_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-xs font-medium">
                          <FaBox className="h-3 w-3" />
                          Rental #{complaint.related_rental_id}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="h-3 w-3" />
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <FaEye className="h-3 w-3" />
                        View Details
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Complaint Details Modal */}
        <AnimatePresence>
          {selectedComplaint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setSelectedComplaint(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{t('complaints.detailTitle')}</h3>
                        <p className="text-sm text-gray-500">Complaint #{selectedComplaint.complaint_uid}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => setSelectedComplaint(null)}
                    >
                      <FaTimes className="h-6 w-6" />
                    </motion.button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Status and Date */}
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(selectedComplaint.status)}`}>
                      {getStatusIcon(selectedComplaint.status)}
                      {t(`complaints.status.${selectedComplaint.status}`)}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaCalendarAlt className="h-4 w-4" />
                      {new Date(selectedComplaint.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Complaint Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">{t('complaints.form.title')}</h4>
                      <p className="text-gray-600">{selectedComplaint.title}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">{t('complaints.form.type')}</h4>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-sm">
                        <FaTag className="h-3 w-3" />
                        {t(`complaints.type.${selectedComplaint.complaint_type}`)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">{t('complaints.form.details')}</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedComplaint.details}</p>
                  </div>

                  {/* Related Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <FaBox className="h-4 w-4" />
                        {t('complaints.form.rental')}
                      </h4>
                      <p className="text-gray-600">{selectedComplaint.related_rental_id || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <FaTag className="h-4 w-4" />
                        {t('complaints.form.product')}
                      </h4>
                      <p className="text-gray-600">{selectedComplaint.related_product_id || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <FaUser className="h-4 w-4" />
                        {t('complaints.form.user')}
                      </h4>
                      <p className="text-gray-600">{selectedComplaint.subject_user_id || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedComplaint.admin_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">{t('complaints.adminNotes')}</h4>
                      <p className="text-blue-700">{selectedComplaint.admin_notes}</p>
                    </div>
                  )}

                  {/* Resolution Notes */}
                  {selectedComplaint.resolution_notes && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2">{t('complaints.resolutionNotes')}</h4>
                      <p className="text-green-700">{selectedComplaint.resolution_notes}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedComplaint.complaint_attachments && selectedComplaint.complaint_attachments.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FaPaperclip className="h-4 w-4" />
                        {t('complaints.form.attachments')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedComplaint.complaint_attachments.map((attachment: any) => (
                          <motion.a
                            key={attachment.id}
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FaFileAlt className="h-5 w-5 text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {attachment.description || 'Attachment'}
                              </p>
                              <p className="text-xs text-gray-500">Click to download</p>
                            </div>
                            <FaDownload className="h-4 w-4 text-gray-400" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UserComplaintsPage; 
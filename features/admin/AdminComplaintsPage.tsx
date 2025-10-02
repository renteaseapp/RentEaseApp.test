import React, { useEffect, useState } from 'react';
import { adminGetComplaints, adminGetComplaintById, adminReplyComplaint } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';

import { Card, CardContent } from '../../components/ui/Card';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaExclamationTriangle, 
  FaSearch, 
  FaTimes, 
  FaEye, 
  FaCheck, 
  FaClock, 
  FaBan,
  FaUser,
  FaBox,
  FaCalendarAlt,
  FaFileAlt,
  FaPaperPlane,
  FaFilter,
  FaSort
} from 'react-icons/fa';

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
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'submitted' | 'under_review' | 'resolved' | 'closed'>('all');

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
        setError('ไม่สามารถโหลดรายการร้องเรียนได้');
        setLoading(false);
      });
  }, [page, limit]);

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
        setError('ไม่สามารถโหลดรายละเอียดการร้องเรียนได้');
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
      setReplyError('ไม่สามารถตอบกลับการร้องเรียนได้');
    } finally {
      setReplyLoading(false);
    }
  };

  // Filter complaints
  let filteredComplaints = complaints;
  if (search) {
    filteredComplaints = complaints.filter(
      c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.details.toLowerCase().includes(search.toLowerCase()) ||
        c.complaint_uid.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply status filter
  if (selectedFilter !== 'all') {
    filteredComplaints = filteredComplaints.filter(c => {
      switch (selectedFilter) {
        case 'submitted':
          return c.status === 'submitted';
        case 'under_review':
          return c.status === 'under_review' || c.status === 'investigating';
        case 'resolved':
          return c.status === 'resolved';
        case 'closed':
          return c.status === 'closed_no_action' || c.status === 'closed_escalated_to_claim';
        default:
          return true;
      }
    });
  }

  const stats = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'submitted').length,
    underReview: complaints.filter(c => c.status === 'under_review' || c.status === 'investigating').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    closed: complaints.filter(c => c.status === 'closed_no_action' || c.status === 'closed_escalated_to_claim').length,
  };

  // Pagination
  const totalPages = Math.ceil(total / limit);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review':
      case 'investigating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed_no_action':
      case 'closed_escalated_to_claim':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FaClock className="h-3 w-3" />;
      case 'under_review':
      case 'investigating':
        return <FaEye className="h-3 w-3" />;
      case 'resolved':
        return <FaCheck className="h-3 w-3" />;
      case 'closed_no_action':
      case 'closed_escalated_to_claim':
        return <FaBan className="h-3 w-3" />;
      default:
        return <FaExclamationTriangle className="h-3 w-3" />;
    }
  };

  // Add these helper functions for static Thai text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'ส่งเรื่องแล้ว';
      case 'under_review':
        return 'อยู่ระหว่างตรวจสอบ';
      case 'awaiting_user_response':
        return 'รอการตอบกลับจากผู้ใช้';
      case 'investigating':
        return 'อยู่ระหว่างสอบสวน';
      case 'resolved':
        return 'แก้ไขแล้ว';
      case 'closed_no_action':
        return 'ปิดแล้ว (ไม่มีการดำเนินการ)';
      case 'closed_escalated_to_claim':
        return 'ปิดแล้ว (ยื่นเรื่องไปที่ประกัน)';
      default:
        return status;
    }
  };

  const getComplaintTypeText = (type: string) => {
    switch (type) {
      case 'product_quality':
        return 'คุณภาพสินค้า';
      case 'delivery_issue':
        return 'ปัญหาการจัดส่ง';
      case 'service_complaint':
        return 'ร้องเรียนบริการ';
      case 'damage_loss':
        return 'สินค้าเสียหาย/สูญหาย';
      case 'billing_issue':
        return 'ปัญหาการเรียกเก็บเงิน';
      case 'other':
        return 'อื่นๆ';
      default:
        return type;
    }
  };

  if (loading && !complaints.length) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <LoadingSpinner message="กำลังโหลด..." />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <ErrorMessage message={error} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto p-4 md:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-600">
                  <FaExclamationTriangle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    การจัดการร้องเรียน
                  </h1>
                  <p className="text-gray-600 mt-1">
                    จัดการและแก้ไขปัญหาร้องเรียน
                  </p>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2 items-center">
                  <Button 
                    onClick={() => setPage((p) => Math.max(1, p - 1))} 
                    disabled={page === 1} 
                    variant="outline" 
                    size="sm"
                  >
                    ← ก่อนหน้า
                  </Button>
                  <span className="text-gray-700 font-medium px-4 py-2 bg-white rounded-lg shadow-sm">
                    {page} / {totalPages}
                  </span>
                  <Button 
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
                    disabled={page === totalPages} 
                    variant="outline" 
                    size="sm"
                  >
                    ถัดไป →
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">ทั้งหมด</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <FaExclamationTriangle className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">ส่งเรื่องแล้ว</p>
                    <p className="text-3xl font-bold">{stats.submitted}</p>
                  </div>
                  <FaClock className="h-8 w-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">อยู่ระหว่างตรวจสอบ</p>
                    <p className="text-3xl font-bold">{stats.underReview}</p>
                  </div>
                  <FaEye className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">แก้ไขแล้ว</p>
                    <p className="text-3xl font-bold">{stats.resolved}</p>
                  </div>
                  <FaCheck className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">ปิดแล้ว</p>
                    <p className="text-3xl font-bold">{stats.closed}</p>
                  </div>
                  <FaBan className="h-8 w-8 text-gray-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="ค้นหาร้องเรียน..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'ร้องเรียนทั้งหมด', icon: <FaExclamationTriangle className="h-4 w-4" /> },
                  { key: 'submitted', label: 'ส่งเรื่องแล้ว', icon: <FaClock className="h-4 w-4" /> },
                  { key: 'under_review', label: 'อยู่ระหว่างตรวจสอบ', icon: <FaEye className="h-4 w-4" /> },
                  { key: 'resolved', label: 'แก้ไขแล้ว', icon: <FaCheck className="h-4 w-4" /> },
                  { key: 'closed', label: 'ปิดแล้ว', icon: <FaBan className="h-4 w-4" /> }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedFilter === filter.key
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.icon}
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSearch(searchInput)} 
                  variant="primary"
                  className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                >
                  <FaSearch className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
                {(search || selectedFilter !== 'all') && (
                  <Button 
                    onClick={() => { 
                      setSearch(''); 
                      setSearchInput(''); 
                      setSelectedFilter('all');
                    }} 
                    variant="outline"
                  >
                    <FaTimes className="h-4 w-4 mr-2" />
                    ล้าง
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Complaints Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredComplaints.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center text-gray-400 py-16"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <FaExclamationTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">ไม่พบร้องเรียน</p>
                    <p className="text-sm text-gray-500 mt-2">ไม่พบร้องเรียนที่ตรงกับเงื่อนไขการค้นหา</p>
                  </div>
                </motion.div>
              )}
              
              {filteredComplaints.map((complaint, index) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className={`transition-all duration-200 cursor-pointer group hover:shadow-xl ${
                      selectedComplaint?.id === complaint.id 
                        ? 'ring-2 ring-red-500 shadow-2xl scale-[1.02]' 
                        : 'hover:ring-1 hover:ring-red-300'
                    }`}
                    onClick={() => handleSelectComplaint(complaint.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            {getStatusText(complaint.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FaCalendarAlt className="h-3 w-3" />
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-800 mb-2 truncate group-hover:text-red-700 transition-colors">
                        {complaint.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {complaint.details}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                          <FaFileAlt className="h-3 w-3" />
                          {getComplaintTypeText(complaint.complaint_type)}
                        </span>
                        {complaint.related_rental_id && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                            <FaBox className="h-3 w-3" />
                            การเช่า: {complaint.related_rental_id}
                          </span>
                        )}
                        {complaint.related_product_id && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">
                            <FaBox className="h-3 w-3" />
                            สินค้า: {complaint.related_product_id}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-mono">ID: {complaint.complaint_uid}</span>
                          <div className="flex items-center gap-1">
                            <FaUser className="h-3 w-3" />
                            {complaint.subject_user_id}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Complaint Details Modal */}
          <AnimatePresence>
      {selectedComplaint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                  <Card className="rounded-2xl shadow-2xl border border-gray-100">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-600">
                            <FaExclamationTriangle className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">
                            รายละเอียดการร้องเรียน
                </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedComplaint(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedComplaint.status)}`}>
                              {getStatusIcon(selectedComplaint.status)}
                              {getStatusText(selectedComplaint.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(selectedComplaint.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-semibold text-gray-700">หัวข้อ</label>
                              <p className="text-gray-900 mt-1">{selectedComplaint.title}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-semibold text-gray-700">ประเภท</label>
                              <p className="text-gray-900 mt-1">{getComplaintTypeText(selectedComplaint.complaint_type)}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-semibold text-gray-700">รายละเอียด</label>
                              <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedComplaint.details}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700">การเช่า</label>
                              <p className="text-gray-900 mt-1">{selectedComplaint.related_rental_id || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700">สินค้า</label>
                              <p className="text-gray-900 mt-1">{selectedComplaint.related_product_id || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700">ผู้ใช้</label>
                              <p className="text-gray-900 mt-1">{selectedComplaint.subject_user_id || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700">ความสำคัญ</label>
                              <p className="text-gray-900 mt-1">{selectedComplaint.priority || '-'}</p>
                    </div>
                  </div>
                          
                          <div>
                            <label className="text-sm font-semibold text-gray-700">ไฟล์แนบ</label>
                            {selectedComplaint.complaint_attachments && selectedComplaint.complaint_attachments.length > 0 ? (
                              <div className="mt-2 space-y-2">
                        {selectedComplaint.complaint_attachments.map((a: any) => (
                                  <a 
                                    key={a.id} 
                                    href={a.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="block text-blue-600 hover:text-blue-800 underline break-all text-sm"
                                  >
                                    {a.description || a.file_url}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 mt-1">ไม่มีไฟล์แนบ</p>
                            )}
                    </div>
                  </div>
                </div>

                {/* Reply/Update Form */}
                      <form onSubmit={handleReplySubmit} className="space-y-6 border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <FaPaperPlane className="h-5 w-5 text-red-500" />
                          อัปเดตการร้องเรียน
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              สถานะ
                            </label>
                      <select
                              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        value={replyForm.status}
                        onChange={e => setReplyForm(f => ({ ...f, status: e.target.value }))}
                        required
                      >
                              <option value="">เลือกสถานะ</option>
                        {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{getStatusText(opt)}</option>
                        ))}
                      </select>
                    </div>
                          
                    <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              หมายเหตุของผู้ดูแล
                            </label>
                      <textarea
                              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        value={replyForm.admin_notes}
                        onChange={e => setReplyForm(f => ({ ...f, admin_notes: e.target.value }))}
                        rows={3}
                              placeholder="เพิ่มหมายเหตุของผู้ดูแล"
                      />
                    </div>
                  </div>
                        
                  <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            หมายเหตุการแก้ไข
                          </label>
                    <textarea
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      value={replyForm.resolution_notes}
                      onChange={e => setReplyForm(f => ({ ...f, resolution_notes: e.target.value }))}
                      rows={3}
                            placeholder="เพิ่มหมายเหตุการแก้ไข"
                    />
                  </div>
                        
                  {replyError && <ErrorMessage message={replyError} />}
                        
                        <div className="flex flex-col md:flex-row gap-3">
                          <Button 
                            type="submit" 
                            variant="primary" 
                            isLoading={replyLoading}
                            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                          >
                            <FaPaperPlane className="h-4 w-4 mr-2" />
                            {replyLoading ? 'กำลังบันทึก' : 'บันทึก'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setSelectedComplaint(null)}
                          >
                            ปิด
                          </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
    </AdminLayout>
  );
}

export default AdminComplaintsPage; 
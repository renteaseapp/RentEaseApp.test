import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations } from '../../services/chatService';
import { ChatConversation, ApiError, PaginatedResponse } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { socketService } from '../../services/socketService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaComments,
  FaSearch,
  FaClock,
  FaTag,
  FaArrowRight,
  FaInbox,
  FaTimes
} from 'react-icons/fa';

export const ChatInboxPage: React.FC = () => {
  const { user } = useAuth();
  const [conversationsResponse, setConversationsResponse] = useState<PaginatedResponse<ChatConversation> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);


  useEffect(() => {
    setIsLoading(true);
    getConversations({ page, limit })
      .then(setConversationsResponse)
      .catch(err => setError((err as ApiError).message || "ไม่สามารถโหลดการสนทนาได้"))
      .finally(() => setIsLoading(false));
  }, [page, limit]);

  // Realtime: listen for conversation updates
  useEffect(() => {
    if (!user?.id) return;
    
    // Connect to socket service
    const token = localStorage.getItem('authToken');
    if (token) {
      socketService.connect(token)
        .then(() => {
          console.log('Socket connected for chat inbox');
          // Join user room
          socketService.emit('join_user', user.id);
          
          // Listen for conversation refresh
          socketService.on('refresh_conversations', () => {
            getConversations({ page, limit })
              .then(setConversationsResponse)
              .catch(err => setError((err as ApiError).message || "Failed to load conversations."));
          });
        })
        .catch(error => {
          console.error('Failed to connect socket for chat inbox:', error);
        });
    }

    return () => {
      // Cleanup: remove listener
      socketService.off('refresh_conversations');
    };
  }, [user?.id, page, limit]);

  // debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(handler);
  }, [search]);

  // ฟิลเตอร์ conversations ใน frontend ตาม debouncedSearch
  const filteredConversations = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return conversationsResponse?.data || [];
    return (conversationsResponse?.data || []).filter(convo =>
      (convo.other_user?.first_name?.toLowerCase().includes(q) || '') ||
      (convo.last_message?.message_content?.toLowerCase().includes(q) || '') ||
      (convo.related_product?.title?.toLowerCase().includes(q) || '')
    );
  }, [conversationsResponse, debouncedSearch]);

  if (isLoading) return <LoadingSpinner message="กำลังโหลดการสนทนา..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4 shadow-lg">
            <FaComments className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            การสนทนาของฉัน
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            เชื่อมต่อกับคู่ค้าผู้เช่าของคุณและจัดการการสนทนาทั้งหมดในที่เดียว
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 relative z-10"
        >
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาการสนทนา..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            />
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                onClick={() => setSearch('')}
              >
                <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {filteredConversations.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredConversations.map((convo, index) => (
                  <motion.div
                    key={convo.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -2, scale: 1.02 }}
                  >
                    <Link to={ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(convo.id))}>
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className="relative">
                            <img
                              src={convo.other_user?.profile_picture_url || `https://picsum.photos/seed/${convo.other_user?.id}/50/50`}
                              alt={convo.other_user?.first_name || undefined}
                              className="w-16 h-16 rounded-full object-cover border-3 border-blue-200 shadow-md group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Online Status */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>

                            {/* Unread Badge */}
                            {convo.unread_count && convo.unread_count > 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                              >
                                {convo.unread_count > 99 ? '99+' : convo.unread_count}
                              </motion.div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                {convo.other_user?.first_name || 'User'}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <FaClock className="h-3 w-3" />
                                <span>
                                  {new Date(convo.last_message?.sent_at || convo.last_message_at || Date.now()).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 truncate max-w-[20rem] group-hover:text-gray-800 transition-colors leading-relaxed">
                              {convo.last_message?.message_content || convo.last_message_content || 'No messages yet.'}
                            </p>

                            {/* Product Info */}
                            {convo.related_product && (
                              <div className="flex items-center gap-2 mt-2">
                                <FaTag className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-blue-600 font-medium">
                                  {convo.related_product.title || convo.related_product_title || 'N/A'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Arrow Icon */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-400 group-hover:text-blue-500 transition-colors"
                          >
                            <FaArrowRight className="h-5 w-5" />
                          </motion.div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Pagination */}
              {conversationsResponse && conversationsResponse.meta.last_page > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex justify-center mt-8 gap-2"
                >
                  {Array.from({ length: conversationsResponse.meta.last_page }, (_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`px-4 py-2 rounded-xl border-2 font-semibold transition-all shadow-sm text-sm ${page === i + 1
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-lg'
                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center py-16"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6">
                  <FaInbox className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {search ? 'ไม่พบการสนทนา' : 'ยังไม่มีสนทนา'}
                </h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  {search
                    ? 'ลองค้นหาด้วยคำค้นที่แตกต่างหรือเรียกดูสินค้าของเราเพื่อเริ่มการสนทนา'
                    : 'เริ่มสำรวจสินค้าของเราและเชื่อมต่อกับผู้ใช้อื่นเพื่อเริ่มการสนทนาครั้งแรก'
                  }
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={ROUTE_PATHS.SEARCH_PRODUCTS}>
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                      <FaSearch className="h-5 w-5" />
                      เรียกดูสินค้า
                      <FaArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

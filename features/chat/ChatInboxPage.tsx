import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations } from '../../services/chatService';
import { ChatConversation, ApiError, PaginatedResponse } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { io, Socket } from 'socket.io-client';

export const ChatInboxPage: React.FC = () => {
  const { user } = useAuth();
  const [conversationsResponse, setConversationsResponse] = useState<PaginatedResponse<ChatConversation> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getConversations({ page, limit })
      .then(setConversationsResponse)
      .catch(err => setError((err as ApiError).message || "Failed to load conversations."))
      .finally(() => setIsLoading(false));
  }, [page, limit]);

  // Realtime: listen for conversation updates
  useEffect(() => {
    if (!user?.id) return;
    const socket = io(process.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: { token: localStorage.getItem('authToken') },
      transports: ['websocket']
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join_user', user.id);
    });
    socket.on('refresh_conversations', () => {
      getConversations({ page, limit })
        .then(setConversationsResponse)
        .catch(err => setError((err as ApiError).message || "Failed to load conversations."));
    });
    return () => {
      socket.disconnect();
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

  if (isLoading) return <LoadingSpinner message="Loading conversations..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-2 md:p-8 max-w-2xl min-h-[80vh]">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 tracking-tight drop-shadow-sm">My Conversations</h1>
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="border-2 border-blue-200 rounded-full px-4 py-2 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm w-full transition-all"
        />
      </div>
      {filteredConversations.length > 0 ? (
        <div className="space-y-4">
          {filteredConversations.map(convo => (
            <Link key={convo.id} to={ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(convo.id))}>
              <Card className="hover:shadow-xl transition-all rounded-2xl border border-blue-100 bg-white/90 group">
                <CardContent className="flex items-center space-x-4 py-4 px-5">
                  <div className="relative">
                    <img
                      src={convo.other_user?.profile_picture_url || `https://picsum.photos/seed/${convo.other_user?.id}/50/50`}
                      alt={convo.other_user?.first_name || undefined}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 shadow group-hover:scale-105 transition-transform"
                    />
                    {convo.unread_count && convo.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                        {convo.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h2 className="text-lg font-semibold text-gray-800 truncate">{convo.other_user?.first_name || 'User'}</h2>
                    </div>
                    <p className="text-sm text-gray-600 truncate max-w-[18rem] group-hover:text-blue-700 transition-colors">
                      {convo.last_message?.message_content || convo.last_message_content || 'No messages yet.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="font-medium text-blue-500">{convo.related_product?.title || convo.related_product_title || 'N/A'}</span>
                      <span className="mx-2">·</span>
                      Last: {new Date(convo.last_message?.sent_at || convo.last_message_at || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {/* Pagination */}
          {conversationsResponse && conversationsResponse.meta.last_page > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: conversationsResponse.meta.last_page }, (_, i) => (
                <button
                  key={i}
                  className={`px-4 py-1.5 rounded-full border-2 font-semibold transition-all shadow-sm text-sm ${page === i+1 ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => setPage(i+1)}
                >
                  {i+1}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/90 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No conversations found.</h3>
          <p className="text-gray-500">Try searching with a different keyword.</p>
        </div>
      )}
    </div>
  );
};

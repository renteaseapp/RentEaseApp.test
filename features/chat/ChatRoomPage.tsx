import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversationMessages, sendMessage, markMessagesAsRead, getConversations } from '../../services/chatService';
import { ChatMessage, ChatConversation, ApiError, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaPaperPlane, 
  FaSmile, 
  FaPaperclip, 
  FaTimes,
  FaDownload,
  FaCircle,
  FaCheck,
  FaCheckDouble
} from 'react-icons/fa';

// ฟังก์ชันแปลงข้อความให้ preview ลิงก์ (url) ได้
function renderMessageWithLinks(text: string) {
  if (!text) return null;
  // Regex match url (http/https)
  const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)|(www\.[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.match(urlRegex)) {
      const url = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all hover:text-blue-800 transition-colors">{part}</a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const ChatRoomPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user: authUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationInfo, setConversationInfo] = useState<Partial<ChatConversation> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessageContent, setNewMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'file' | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const isAtBottomRef = useRef(true);

  const fetchMessages = async (opts?: { before_message_id?: string }) => {
    if (conversationId) {
      setIsLoading(true);
      try {
        const msgs = await getConversationMessages(conversationId, { before_message_id: opts?.before_message_id, limit: 20 });
        if (opts?.before_message_id) {
          setMessages(prev => [...msgs, ...prev]);
          setHasMore(msgs.length === 20);
        } else {
          setMessages(msgs);
          setHasMore(msgs.length === 20);
        }
        await markMessagesAsRead(conversationId);
      } catch (err) {
        setError((err as ApiError).message || "Failed to load messages.");
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    }
  };
  
  useEffect(() => {
    fetchMessages();
  }, [conversationId, authUser]);

  useEffect(() => {
    // Connect socket.io
    const socket = io(process.env.VITE_SOCKET_URL || 'https://renteaseapi-test.onrender.com', {
      auth: { token: localStorage.getItem('authToken') },
      transports: ['websocket']
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (conversationId) {
        socket.emit('join_conversation', conversationId);
        console.log('Emit join_conversation', conversationId);
      }
    });
    socket.on('new_message', (msg: any) => {
      console.log('Received new_message:', msg);
      setMessages(prev => {
        if (prev.some(m => m.message_uid === msg.message_uid)) return prev;
        const updated = [...prev, msg];
        console.log('Updated messages after push:', updated);
        return updated;
      });
    });
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    return () => {
      socket.disconnect();
      console.log('Socket disconnected (cleanup)');
    };
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !conversationId) return;
    setIsSending(true);
    try {
      const sentMessage = await sendMessage({ conversation_id: conversationId, message_content: newMessageContent });
      setMessages(prev => [...prev, sentMessage]);
      setNewMessageContent('');
      await markMessagesAsRead(conversationId);
    } catch (err) {
      setError((err as ApiError).message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    console.log('Rendering messages:', messages);
  }, [messages]);

  // Unique messages for rendering
  const uniqueMessages = React.useMemo(() => {
    const seen = new Set();
    return messages.filter(msg => {
      const key = msg.message_uid || (msg.id + '_' + msg.sent_at);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages]);

  // Fetch conversation info for header (who are you chatting with)
  useEffect(() => {
    const fetchConversationInfo = async () => {
      if (!conversationId) return;
      try {
        // No getConversationById, so fetch all and find the one we want
        const { data } = await getConversations({ page: 1, limit: 50 });
        const convo = data.find((c) => c.id == conversationId);
        setConversationInfo(convo || null);
      } catch (err) {
        setConversationInfo(null);
      }
    };
    fetchConversationInfo();
  }, [conversationId]);

  // อัปโหลดไฟล์ในแชท
  const handleFileUpload = async (file: File, messageContent = '') => {
    if (!conversationId) return;
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (messageContent) formData.append('message_content', messageContent);
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = process.env.VITE_API_URL || 'https://renteaseapi-test.onrender.com/api';
      const res = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token
            // **อย่าใส่ Content-Type เอง**
          },
          body: formData
        }
      );
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      // เพิ่ม message ที่ได้เข้า state (หรือรอ socket ก็ได้)
      setMessages(prev => [...prev, data.data]);
    } catch (err) {
      setError(`Failed to upload file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFileUploading(false);
    }
  };

  // Add this useEffect to always scroll to the latest message when messages change
  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (isLoading) return <LoadingSpinner message="Loading chat..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-lg border-b border-gray-200 rounded-b-2xl"
        >
          <div className="flex items-center gap-4 p-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link to={ROUTE_PATHS.CHAT_INBOX} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <FaArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
            </motion.div>
            
            <div className="relative">
              <img 
                src={conversationInfo?.other_user?.profile_picture_url || `https://picsum.photos/seed/${conversationInfo?.other_user?.id}/50/50`} 
                className="w-12 h-12 rounded-full border-3 border-blue-200 shadow-md" 
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            <div className="flex-1">
              <h2 className="font-bold text-lg text-gray-800">{conversationInfo?.other_user?.first_name || 'User'}</h2>
              <div className="flex items-center gap-2">
                <FaCircle className="w-2 h-2 text-green-500" />
                <span className="text-sm text-gray-500">Online</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar"
            onScroll={e => {
              const el = e.currentTarget;
              isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
            }}
          >
            {/* Load More Button */}
            {hasMore && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-500 underline hover:text-blue-700 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200"
                  disabled={loadingMore}
                  onClick={() => {
                    setLoadingMore(true);
                    fetchMessages({ before_message_id: messages[0]?.id });
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load previous messages'}
                </motion.button>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {uniqueMessages.map((msg, idx, arr) => {
                const isMe = msg.sender_id === authUser?.id;
                const prev = arr[idx - 1];
                const next = arr[idx + 1];
                const isFirstOfGroup = !prev || prev.sender_id !== msg.sender_id;
                const isLastOfGroup = !next || next.sender_id !== msg.sender_id;
                
                return (
                  <motion.div
                    key={msg.message_uid || (msg.id + '_' + msg.sent_at)}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    {!isMe && isFirstOfGroup && (
                      <img 
                        src={conversationInfo?.other_user?.profile_picture_url || `https://picsum.photos/seed/${conversationInfo?.other_user?.id}/50/50`} 
                        className="w-8 h-8 rounded-full mr-2 self-end shadow-sm" 
                      />
                    )}
                    
                    <div className={`
                      max-w-[70%] px-4 py-3 shadow-sm
                      ${isMe
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'}
                      ${isMe
                        ? `${isFirstOfGroup ? 'rounded-t-2xl' : 'rounded-tr-lg'} ${isLastOfGroup ? 'rounded-b-2xl' : 'rounded-br-lg'} rounded-l-2xl`
                        : `${isFirstOfGroup ? 'rounded-t-2xl' : 'rounded-tl-lg'} ${isLastOfGroup ? 'rounded-b-2xl' : 'rounded-bl-lg'} rounded-r-2xl`}
                    `}>
                      {/* File Attachment */}
                      {msg.attachment_url && (
                        <div className="mb-3">
                          {msg.message_type === 'image' ? (
                            <motion.img
                              whileHover={{ scale: 1.02 }}
                              src={msg.attachment_url}
                              alt="attachment"
                              className="max-h-48 rounded-lg cursor-pointer border border-gray-200 shadow-sm"
                              onClick={() => {
                                setPreviewUrl(msg.attachment_url!);
                                setPreviewType('image');
                                setPreviewName(msg.attachment_metadata?.originalname || null);
                              }}
                            />
                          ) : (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200"
                              onClick={() => {
                                setPreviewUrl(msg.attachment_url!);
                                setPreviewType('file');
                                setPreviewName(msg.attachment_metadata?.originalname || null);
                              }}
                            >
                              <FaPaperclip className="text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {msg.attachment_metadata?.originalname || 'Download file'}
                              </span>
                              <FaDownload className="text-gray-400 ml-auto" />
                            </motion.div>
                          )}
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div className="break-words whitespace-pre-line text-sm leading-relaxed">
                        {renderMessageWithLinks(msg.message_content)}
                      </div>
                      
                      {/* Message Time and Status */}
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <span className="text-xs opacity-70">
                          {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <div className="flex items-center gap-1">
                            <FaCheck className="w-3 h-3" />
                            <FaCheckDouble className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white shadow-lg border-t border-gray-200 rounded-t-2xl p-4"
        >
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <FaSmile className="w-5 h-5 text-gray-500" />
            </motion.button>
            
            <div className="flex-1 relative">
              <input
                name="newMessage"
                type="text"
                value={newMessageContent}
                onChange={e => setNewMessageContent(e.target.value)}
                placeholder="Type a message..."
                className="w-full rounded-full border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                autoComplete="off"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaPaperclip className="w-5 h-5 text-gray-500" />
            </motion.button>
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file, newMessageContent);
                  setNewMessageContent('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.zip,.rar,.txt,.csv,.ppt,.pptx,.doc,.docx"
            />
            
            <motion.button
              type="submit"
              disabled={!newMessageContent.trim() || isSending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <FaPaperPlane className="w-5 h-5" />
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-full max-h-full p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl transition-colors"
                onClick={() => setPreviewUrl(null)}
              >
                <FaTimes />
              </motion.button>
              
              {previewType === 'image' ? (
                <img src={previewUrl} alt={previewName || 'preview'} className="max-h-[70vh] max-w-[80vw] object-contain rounded-xl shadow" />
              ) : (
                <div className="flex flex-col items-center p-8">
                  <FaPaperclip className="text-6xl text-gray-400 mb-4" />
                  <span className="mb-4 font-semibold text-lg text-gray-800">{previewName || 'File preview'}</span>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <FaDownload />
                    Download / Open
                  </motion.a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversationMessages, sendMessage, markMessagesAsRead, getConversations } from '../../services/chatService';
import { ChatMessage, ChatConversation, ApiError, User } from '../../types'; // Assuming ChatConversation might be needed for context
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { ROUTE_PATHS } from '../../constants';
import { io, Socket } from 'socket.io-client';

// Placeholder for fetching conversation details if needed (e.g., other user's name)
// const getConversationDetails = async (conversationId: string): Promise<Partial<ChatConversation>> => {
//     return new Promise(res => setTimeout(() => res({other_user: {id:2, first_name: "Mock Partner"}}), 100));
// }

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
  const [fileUploading, setFileUploading] = useState(false);
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
    const socket = io(process.env.VITE_SOCKET_URL || 'http://localhost:3001', {
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
      const res = await fetch(
        `/api/chat/conversations/${conversationId}/messages/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token
            // **อย่าใส่ Content-Type เอง**
          },
          body: formData
        }
      );
      const data = await res.json();
      // เพิ่ม message ที่ได้เข้า state (หรือรอ socket ก็ได้)
      setMessages(prev => [...prev, data.data]);
    } catch (err) {
      setError('Failed to upload file');
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
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl flex flex-col h-[calc(100vh-64px)] shadow-xl rounded-xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center gap-3 p-3 bg-[#0084ff] rounded-t-xl shadow sticky top-0 z-10">
          <Link to={ROUTE_PATHS.CHAT_INBOX} className="p-2 rounded-full hover:bg-blue-700 transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <img src={conversationInfo?.other_user?.profile_picture_url || `https://picsum.photos/seed/${conversationInfo?.other_user?.id}/50/50`} className="w-10 h-10 rounded-full border-2 border-white shadow" />
          <div>
            <div className="font-bold text-white text-lg">{conversationInfo?.other_user?.first_name || 'User'}</div>
            <div className="text-xs text-blue-100">กำลังใช้งาน</div>
          </div>
      </div>
        {/* MESSAGE LIST */}
        <div
          className="flex-grow overflow-y-auto bg-[#f0f2f5] px-4 py-6 custom-scrollbar"
          onScroll={e => {
            const el = e.currentTarget;
            isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          }}
        >
        {hasMore && !isLoading && (
          <div className="text-center mb-2">
            <button className="text-blue-500 underline hover:text-blue-700 transition-colors" disabled={loadingMore} onClick={() => {
              setLoadingMore(true);
              fetchMessages({ before_message_id: messages[0]?.id });
            }}>Load previous</button>
          </div>
        )}
          {/* Messenger-style bubble grouping */}
          {uniqueMessages.map((msg, idx, arr) => {
            const isMe = msg.sender_id === authUser?.id;
            const prev = arr[idx - 1];
            const next = arr[idx + 1];
            const isFirstOfGroup = !prev || prev.sender_id !== msg.sender_id;
            const isLastOfGroup = !next || next.sender_id !== msg.sender_id;
            return (
              <div key={msg.message_uid || (msg.id + '_' + msg.sent_at)} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                {!isMe && isFirstOfGroup && (
                  <img src={conversationInfo?.other_user?.profile_picture_url || `https://picsum.photos/seed/${conversationInfo?.other_user?.id}/50/50`} className="w-7 h-7 rounded-full mr-2 self-end" />
                )}
                <div className={`
                  px-4 py-2 shadow
                  ${isMe
                    ? 'bg-[#0084ff] text-white'
                    : 'bg-white text-gray-900 border'}
                  max-w-[70%]
                  ${isMe
                    ? `${isFirstOfGroup ? 'rounded-t-2xl' : 'rounded-tr-md'} ${isLastOfGroup ? 'rounded-b-2xl' : 'rounded-br-md'} rounded-l-2xl`
                    : `${isFirstOfGroup ? 'rounded-t-2xl' : 'rounded-tl-md'} ${isLastOfGroup ? 'rounded-b-2xl' : 'rounded-bl-md'} rounded-r-2xl`}
                  animate-fadeIn
                `}>
              {/* ถ้ามีไฟล์แนบ */}
              {msg.attachment_url && (
                msg.message_type === 'image' ? (
                  <img
                    src={msg.attachment_url}
                    alt="attachment"
                    className="max-h-40 mb-2 rounded-lg cursor-pointer border border-blue-200 group-hover:shadow-lg transition-all"
                    onClick={() => {
                      setPreviewUrl(msg.attachment_url!);
                      setPreviewType('image');
                      setPreviewName(msg.attachment_metadata?.originalname || null);
                    }}
                  />
                ) : (
                  <a
                    href={msg.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline block mb-2 cursor-pointer hover:text-blue-800"
                    onClick={e => {
                      e.preventDefault();
                      setPreviewUrl(msg.attachment_url!);
                      setPreviewType('file');
                      setPreviewName(msg.attachment_metadata?.originalname || null);
                    }}
                  >
                    📎 {msg.attachment_metadata?.originalname || 'Download file'}
                  </a>
                )
              )}
                  <div className="break-words whitespace-pre-line text-base">
                {renderMessageWithLinks(msg.message_content)}
                  </div>
                  <div className="text-xs mt-1 text-gray-400 text-right">{new Date(msg.sent_at).toLocaleTimeString()}</div>
            </div>
          </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>
        {/* INPUT BAR */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-3 bg-white rounded-b-xl shadow sticky bottom-0 z-10">
          <button type="button" className="p-2 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M15 9h.01M12 9h.01M9 9h.01" /></svg>
          </button>
          <input
            name="newMessage"
            type="text"
            value={newMessageContent}
            onChange={e => setNewMessageContent(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-grow rounded-full border px-4 py-2 focus:ring-2 focus:ring-blue-100 transition text-base bg-gray-50"
            autoComplete="off"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button type="button" className="p-2 rounded-full hover:bg-gray-100" onClick={() => fileInputRef.current?.click()}>
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 10-2.828-2.828z" /></svg>
          </button>
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
          <button
            type="submit"
            disabled={!newMessageContent.trim() || isSending}
            className="p-2 rounded-full bg-[#0084ff] hover:bg-blue-700 text-white shadow transition flex items-center justify-center"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {isSending ? (
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            )}
          </button>
        </form>
      </div>

      {/* Modal สำหรับ preview ไฟล์/รูป */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-all" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-full max-h-full p-4 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-2xl transition-colors" onClick={() => setPreviewUrl(null)}>&times;</button>
            {previewType === 'image' ? (
              <img src={previewUrl} alt={previewName || 'preview'} className="max-h-[70vh] max-w-[80vw] object-contain rounded-xl shadow" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="mb-2 font-semibold text-lg">{previewName || 'File preview'}</span>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors">Download / Open</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

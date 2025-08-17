import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { ChatMessage } from '../types';

interface TypingUser {
  userId: number;
  isTyping: boolean;
}

interface UseRealtimeChatProps {
  conversationId: string;
  currentUserId: string;
}

export const useRealtimeChat = ({ conversationId, currentUserId }: UseRealtimeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Join conversation when component mounts
  useEffect(() => {
    if (conversationId) {
      socketService.joinConversation(conversationId);
      setIsConnected(true);
    }

    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (message: ChatMessage) => {
      if (message.conversation_id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleUserTyping = (data: any) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          const existing = prev.find(user => user.userId === data.userId);
          if (existing) {
            if (data.isTyping) {
              return prev; // Already typing
            } else {
              return prev.filter(user => user.userId !== data.userId);
            }
          } else {
            if (data.isTyping) {
              return [...prev, { userId: data.userId, isTyping: true }];
            } else {
              return prev;
            }
          }
        });
      }
    };

    const handleMessageRead = (data: any) => {
      if (data.conversationId === conversationId) {
        // Handle read receipts if needed
        console.log('Message read:', data);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onMessageReadReceipt(handleMessageRead);

    return () => {
      socketService.offCallback('new_message', handleNewMessage);
      socketService.offCallback('user_typing', handleUserTyping);
      socketService.offCallback('message_read_receipt', handleMessageRead);
    };
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback((messageContent: string, messageType: 'text' | 'image' | 'file' | 'rental_inquiry' = 'text', attachmentUrl?: string) => {
    const message = {
      conversation_id: conversationId,
      message_content: messageContent,
      message_type: messageType,
      attachment_url: attachmentUrl
    };

    socketService.sendMessage(message);
  }, [conversationId]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    socketService.startTyping(conversationId);
  }, [conversationId]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    socketService.stopTyping(conversationId);
  }, [conversationId]);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId: string) => {
    socketService.markMessageAsRead(conversationId, messageId);
  }, [conversationId]);

  // Set initial messages
  const setInitialMessages = useCallback((initialMessages: ChatMessage[]) => {
    setMessages(initialMessages);
  }, []);

  return {
    messages,
    typingUsers,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    setInitialMessages
  };
}; 
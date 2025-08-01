import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChatMessage, aiChatService } from '../services/aiChatService';

interface AIChatContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const AIChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: aiChatService.generateMessageId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // เพิ่มข้อความของผู้ใช้
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // ส่งข้อความไปยัง AI
      const response = await aiChatService.sendMessage(content, messages);
      
      const assistantMessage: ChatMessage = {
        id: aiChatService.generateMessageId(),
        role: 'model',
        content: response.choices[0].message.content,
        timestamp: new Date()
      };

      // เพิ่มข้อความของ AI
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการส่งข้อความ';
      setError(errorMessage);
      console.error('AI Chat Error:', err);
      
      // If it's an API key configuration error, show a more helpful message
      if (errorMessage.includes('API key is not configured')) {
        setError('AI Chat ไม่พร้อมใช้งาน - กรุณาตั้งค่า API Key ตามคำแนะนำใน AI_CHAT_SETUP.md');
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const value: AIChatContextType = {
    isOpen,
    messages,
    isLoading,
    error,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    clearChat
  };

  return (
    <AIChatContext.Provider value={value}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = (): AIChatContextType => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};

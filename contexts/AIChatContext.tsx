import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChatMessage, aiChatService } from '../services/aiChatService';
import { aiProductAssistantService } from '../services/aiProductAssistantService';

interface AIChatContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  enableProductSearch: boolean;
  enableWebSearch: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  toggleProductSearch: () => void;
  toggleWebSearch: () => void;
  getProductContext: () => any;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const AIChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableProductSearch, setEnableProductSearch] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);

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
      // ตรวจสอบว่าต้องการค้นหาสินค้าหรือเปรียบเทียบกับเว็บหรือไม่
      let productResponse = '';
      if (enableProductSearch) {
        console.log('🔍 AI Product Search enabled, processing message...');
        try {
          // ตรวจสอบว่าเป็นคำขอเปรียบเทียบหรือไม่
          const isComparisonRequest = /เปรียบเทียบ|compare|ราคา.*ตลาด|ราคา.*อื่น|ราคา.*นอก/.test(content.toLowerCase());
          
          if (isComparisonRequest && enableWebSearch) {
            console.log('🌐 Web comparison requested...');
            const comparison = await aiProductAssistantService.compareWithWeb(content);
            productResponse = comparison.comparisonSummary;
          } else {
            productResponse = await aiProductAssistantService.processMessageWithProducts(content);
          }
          
          if (productResponse) {
            console.log('✅ Product context found:', productResponse.length, 'characters');
          } else {
            console.log('ℹ️ No product context found for this message');
          }
        } catch (error) {
          console.error('❌ Error getting product context:', error);
          productResponse = '\n\n⚠️ ไม่สามารถค้นหาสินค้าได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
        }
      }

      let aiContent = '';
      
      // ถ้ามีผลลัพธ์การค้นหาสินค้า ให้แสดงเฉพาะผลลัพธ์นั้น
      if (productResponse) {
        aiContent = productResponse;
      } else {
        // ถ้าไม่มีผลลัพธ์การค้นหาสินค้า ให้ส่งข้อความไปยัง AI
        const response = await aiChatService.sendMessage(content, messages);
        aiContent = response.choices[0].message.content;
      }

      const assistantMessage: ChatMessage = {
        id: aiChatService.generateMessageId(),
        role: 'model',
        content: aiContent,
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
  }, [messages, enableProductSearch]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const toggleProductSearch = useCallback(() => {
    const newState = aiProductAssistantService.toggleProductSearch();
    setEnableProductSearch(newState);
  }, []);

  const toggleWebSearch = useCallback(() => {
    const newState = aiProductAssistantService.toggleWebSearch();
    setEnableWebSearch(newState);
  }, []);

  const getProductContext = useCallback(() => {
    return aiProductAssistantService.getContext();
  }, []);

  const value: AIChatContextType = {
    isOpen,
    messages,
    isLoading,
    error,
    enableProductSearch,
    enableWebSearch,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    clearChat,
    toggleProductSearch,
    toggleWebSearch,
    getProductContext
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

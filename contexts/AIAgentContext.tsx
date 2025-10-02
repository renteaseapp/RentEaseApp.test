import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AIAgentService, AIAgentResponse } from '../services/aiAgentService';
import { AIAgentMemory, ConversationMessage, AgentThought, ProductMemory } from '../services/aiAgentMemory';

export interface AIAgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  thoughts?: AgentThought[];
  products?: ProductMemory[];
  confidence?: number;
  intent?: string;
  isTyping?: boolean;
}

export interface AIAgentContextType {
  // UI State
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Messages and Conversation
  messages: AIAgentMessage[];
  sessionId: string;
  
  // Agent Features
  memoryEnabled: boolean;
  thoughtProcessEnabled: boolean;
  showThoughts: boolean;
  
  // Agent Stats
  memoryStats: {
    totalProducts: number;
    totalConversations: number;
    totalThoughts: number;
  } | null;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
  clearConversation: () => void;
  clearAllMemory: () => void;
  
  // Settings
  toggleMemory: () => void;
  toggleThoughtProcess: () => void;
  toggleShowThoughts: () => void;
  
  // Product Actions
  viewProductDetails: (productId: string) => void;
  addToFavorites: (productId: string) => void;
  
  // Memory and Thoughts
  getRecentThoughts: (limit?: number) => AgentThought[];
  refreshProductKnowledge: () => Promise<void>;
}

const AIAgentContext = createContext<AIAgentContextType | undefined>(undefined);

export const useAIAgent = (): AIAgentContextType => {
  const context = useContext(AIAgentContext);
  if (!context) {
    throw new Error('useAIAgent must be used within an AIAgentProvider');
  }
  return context;
};

interface AIAgentProviderProps {
  children: React.ReactNode;
}

export const AIAgentProvider: React.FC<AIAgentProviderProps> = ({ children }) => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Messages and Conversation
  const [messages, setMessages] = useState<AIAgentMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Agent Features
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [thoughtProcessEnabled, setThoughtProcessEnabled] = useState(true);
  const [showThoughts, setShowThoughts] = useState(false);
  
  // Agent Stats
  const [memoryStats, setMemoryStats] = useState<{
    totalProducts: number;
    totalConversations: number;
    totalThoughts: number;
  } | null>(null);

  // Services
  const aiAgent = AIAgentService.getInstance();
  const memory = AIAgentMemory.getInstance();

  // Initialize AI Agent
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          setError('กรุณาตั้งค่า VITE_GEMINI_API_KEY ในไฟล์ .env');
          return;
        }
        
        await aiAgent.initialize(apiKey);
        updateMemoryStats();
        
        // Load welcome message
        const welcomeMessage: AIAgentMessage = {
          id: `welcome_${Date.now()}`,
          role: 'agent',
          content: `สวัสดีครับ! ผมคือ AI Agent ของ RentEase 🤖

ผมมีความสามารถพิเศษ:
✨ **มีความจำ** - จดจำการสนทนาและความชอบของคุณ
🧠 **มีความคิด** - วิเคราะห์และให้เหตุผลในการแนะนำ
🔍 **ค้นหาสินค้า** - หาสินค้าที่ตรงกับความต้องการ
💡 **แนะนำอัจฉริยะ** - แนะนำสินค้าตามบริบทและประวัติ

ลองถามผมเกี่ยวกับสินค้าที่ต้องการเช่า หรือให้ผมแนะนำสินค้าที่น่าสนใจดูครับ!`,
          timestamp: new Date(),
          confidence: 1.0,
          intent: 'welcome'
        };
        
        setMessages([welcomeMessage]);
        
      } catch (err) {
        console.error('Failed to initialize AI Agent:', err);
        setError('ไม่สามารถเริ่มต้น AI Agent ได้ กรุณาลองใหม่อีกครั้ง');
      }
    };

    initializeAgent();
  }, []);

  // Update memory stats
  const updateMemoryStats = useCallback(() => {
    const stats = aiAgent.getMemoryStats();
    setMemoryStats(stats);
  }, [aiAgent]);

  // Send message to AI Agent
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: AIAgentMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Add typing indicator
    const typingMessage: AIAgentMessage = {
      id: `typing_${Date.now()}`,
      role: 'agent',
      content: 'กำลังคิด...',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      const response: AIAgentResponse = await aiAgent.sendMessage(message, sessionId);

      // Remove typing indicator and add agent response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const agentMessage: AIAgentMessage = {
          id: response.id,
          role: 'agent',
          content: response.content,
          timestamp: response.timestamp,
          thoughts: response.thoughts,
          products: response.products,
          confidence: response.confidence,
          intent: response.intent
        };
        return [...withoutTyping, agentMessage];
      });

      updateMemoryStats();

    } catch (err) {
      console.error('Error sending message:', err);
      
      // Remove typing indicator and show error
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อความ';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: AIAgentMessage = {
        id: `error_${Date.now()}`,
        role: 'agent',
        content: `ขออภัยครับ เกิดข้อผิดพลาด: ${errorMessage}`,
        timestamp: new Date(),
        confidence: 0
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, aiAgent, updateMemoryStats]);

  // UI Actions
  const openAgent = useCallback(() => setIsOpen(true), []);
  const closeAgent = useCallback(() => setIsOpen(false), []);
  const toggleAgent = useCallback(() => setIsOpen(prev => !prev), []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    
    // Add welcome message back
    const welcomeMessage: AIAgentMessage = {
      id: `welcome_${Date.now()}`,
      role: 'agent',
      content: 'สวัสดีครับ! มีอะไรให้ผมช่วยเหลือไหมครับ?',
      timestamp: new Date(),
      confidence: 1.0,
      intent: 'welcome'
    };
    
    setMessages([welcomeMessage]);
  }, []);

  // Clear all memory
  const clearAllMemory = useCallback(() => {
    aiAgent.clearMemory();
    clearConversation();
    updateMemoryStats();
  }, [aiAgent, clearConversation, updateMemoryStats]);

  // Settings
  const toggleMemory = useCallback(() => {
    setMemoryEnabled(prev => !prev);
  }, []);

  const toggleThoughtProcess = useCallback(() => {
    setThoughtProcessEnabled(prev => !prev);
  }, []);

  const toggleShowThoughts = useCallback(() => {
    setShowThoughts(prev => !prev);
  }, []);

  // Product Actions
  const viewProductDetails = useCallback((productId: string) => {
    // Navigate to product detail page
    window.open(`/products/${productId}`, '_blank');
  }, []);

  const addToFavorites = useCallback((productId: string) => {
    // Add to favorites logic
    console.log('Adding to favorites:', productId);
    // You can implement actual favorites functionality here
  }, []);

  // Memory and Thoughts
  const getRecentThoughts = useCallback((limit: number = 10): AgentThought[] => {
    return aiAgent.getRecentThoughts(limit);
  }, [aiAgent]);

  const refreshProductKnowledge = useCallback(async () => {
    try {
      await aiAgent.refreshProductKnowledge();
      updateMemoryStats();
    } catch (err) {
      console.error('Failed to refresh product knowledge:', err);
    }
  }, [aiAgent, updateMemoryStats]);

  const contextValue: AIAgentContextType = {
    // UI State
    isOpen,
    isLoading,
    error,
    
    // Messages and Conversation
    messages,
    sessionId,
    
    // Agent Features
    memoryEnabled,
    thoughtProcessEnabled,
    showThoughts,
    
    // Agent Stats
    memoryStats,
    
    // Actions
    sendMessage,
    openAgent,
    closeAgent,
    toggleAgent,
    clearConversation,
    clearAllMemory,
    
    // Settings
    toggleMemory,
    toggleThoughtProcess,
    toggleShowThoughts,
    
    // Product Actions
    viewProductDetails,
    addToFavorites,
    
    // Memory and Thoughts
    getRecentThoughts,
    refreshProductKnowledge
  };

  return (
    <AIAgentContext.Provider value={contextValue}>
      {children}
    </AIAgentContext.Provider>
  );
};

export default AIAgentContext;
import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Trash2,
  Brain,
  Database,
  Eye,
  Settings,
  TrendingUp,
  RefreshCw,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { useAIAgent } from '../contexts/AIAgentContext';
import { ProductGrid } from './ProductCard';
import { AgentThought } from '../services/aiAgentMemory';

export const AIAgentWidget: React.FC = () => {
  const {
    isOpen,
    isLoading,
    error,
    messages,
    memoryEnabled,
    thoughtProcessEnabled,
    showThoughts,
    memoryStats,
    sendMessage,
    openAgent,
    closeAgent,
    clearConversation,
    clearAllMemory,
    toggleMemory,
    toggleThoughtProcess,
    toggleShowThoughts,
    viewProductDetails,
    addToFavorites,
    refreshProductKnowledge
  } = useAIAgent();

  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderThoughts = (thoughts: AgentThought[]) => {
    if (!showThoughts || !thoughts || thoughts.length === 0) return null;

    return (
      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center mb-2">
          <Brain className="w-4 h-4 text-purple-600 mr-1" />
          <span className="text-xs font-medium text-purple-700">ความคิดของ AI Agent</span>
        </div>
        <div className="space-y-1">
          {thoughts.map((thought, index) => (
            <div key={index} className="text-xs text-purple-600">
              <span className="font-medium">[{thought.type}]</span> {thought.content}
              <span className="text-purple-400 ml-2">({Math.round(thought.confidence * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProducts = (products: any[]) => {
    if (!products || products.length === 0) return null;

    return (
      <div className="mt-3">
        <div className="flex items-center mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
          <span className="text-sm font-medium text-gray-700">สินค้าที่แนะนำ</span>
        </div>
        <ProductGrid
          products={products}
          onViewDetails={viewProductDetails}
          onAddToFavorites={addToFavorites}
          compact={true}
          maxItems={3}
        />
      </div>
    );
  };

  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';
    const isTyping = message.isTyping;

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isUser
                ? 'bg-blue-600 text-white'
                : isTyping
                ? 'bg-gray-100 text-gray-600'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isTyping ? (
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm ml-2">{message.content}</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* Message metadata */}
          {!isUser && !isTyping && (
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <span>{message.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                {message.confidence && (
                  <span className="flex items-center">
                    <Brain className="w-3 h-3 mr-1" />
                    {Math.round(message.confidence * 100)}%
                  </span>
                )}
                {message.intent && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {message.intent}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Agent thoughts */}
          {!isUser && message.thoughts && renderThoughts(message.thoughts)}

          {/* Product recommendations */}
          {!isUser && message.products && renderProducts(message.products)}
        </div>
      </div>
    );
  };

  const renderWelcomeMessage = () => (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Brain className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Agent พร้อมให้บริการ!</h3>
      <p className="text-sm text-gray-600 mb-4">
        ผมมีความจำและความคิด พร้อมช่วยคุณหาสินค้าที่ต้องการ
      </p>
      
      <div className="grid grid-cols-1 gap-2 text-left">
        <button
          onClick={() => sendMessage('แนะนำสินค้าที่น่าสนใจหน่อย')}
          className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors w-full text-left"
        >
          💡 แนะนำสินค้าที่น่าสนใจ
        </button>
        <button
          onClick={() => sendMessage('หาสินค้าราคาไม่เกิน 1000 บาท')}
          className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm text-green-700 transition-colors w-full text-left"
        >
          💰 หาสินค้าราคาประหยัด
        </button>
        <button
          onClick={() => sendMessage('มีสินค้าอะไรใหม่ๆ บ้าง')}
          className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-purple-700 transition-colors w-full text-left"
        >
          ✨ สินค้าใหม่ล่าสุด
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">การตั้งค่า AI Agent</h4>
        <button
          onClick={() => setShowSettings(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Memory Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm text-gray-700">ความจำ</span>
          </div>
          <button
            onClick={toggleMemory}
            className={`w-10 h-6 rounded-full transition-colors ${
              memoryEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                memoryEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Thought Process Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm text-gray-700">กระบวนการคิด</span>
          </div>
          <button
            onClick={toggleThoughtProcess}
            className={`w-10 h-6 rounded-full transition-colors ${
              thoughtProcessEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                thoughtProcessEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Show Thoughts Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm text-gray-700">แสดงความคิด</span>
          </div>
          <button
            onClick={toggleShowThoughts}
            className={`w-10 h-6 rounded-full transition-colors ${
              showThoughts ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                showThoughts ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Memory Stats */}
        {memoryStats && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div>สินค้าในความจำ: {memoryStats.totalProducts}</div>
              <div>การสนทนา: {memoryStats.totalConversations}</div>
              <div>ความคิด: {memoryStats.totalThoughts}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={refreshProductKnowledge}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            อัปเดตข้อมูล
          </button>
          <button
            onClick={clearAllMemory}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            ล้างความจำ
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <button
        onClick={openAgent}
        className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center z-50"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
        <span className="text-xs font-semibold">AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] md:h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 lg:bottom-6 lg:right-6 md:bottom-4 md:right-4 sm:bottom-4 sm:right-4 xs:bottom-2 xs:right-2 xs:w-72 xs:h-[450px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
        <div className="flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          <div>
            <h3 className="font-semibold text-sm md:text-base">AI Agent</h3>
            <p className="text-xs opacity-90 hidden sm:block">มีความจำและความคิด</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={clearConversation}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closeAgent}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && renderSettings()}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? renderWelcomeMessage() : messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="พิมพ์ข้อความ..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentWidget;
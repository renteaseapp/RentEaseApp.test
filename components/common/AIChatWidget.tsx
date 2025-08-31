import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { aiChatService } from '../../services/aiChatService';
import { X, Send, Bot, MessageCircle, Trash2, Search, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIChatWidget: React.FC = () => {
  const { isOpen, messages, isLoading, error, enableProductSearch, enableWebSearch, closeChat, sendMessage, clearChat, toggleProductSearch, toggleWebSearch } = useAIChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Function to render message content with clickable links
  const renderMessageContent = (content: string) => {
    // Split content by lines to handle each line separately
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check if line contains a product link pattern
      const linkMatch = line.match(/🔗 ดูรายละเอียด: \/products\/([^\s]+)/);
      
      if (linkMatch) {
        const slug = linkMatch[1];
        const beforeLink = line.substring(0, linkMatch.index);
        const afterLink = line.substring(linkMatch.index! + linkMatch[0].length);
        
        return (
          <div key={lineIndex}>
            {beforeLink}
            <button
              onClick={() => {
                navigate(`/products/${slug}`);
                closeChat();
              }}
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer ml-1"
            >
              🔗 ดูรายละเอียด
            </button>
            {afterLink}
          </div>
        );
      }
      
      // For regular lines, just return the text
      return <div key={lineIndex}>{line}</div>;
    });
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className="w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span className="font-semibold">AI Assistant</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleProductSearch}
                className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                  enableProductSearch 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={enableProductSearch ? "ปิดการค้นหาสินค้า" : "เปิดการค้นหาสินค้า"}
              >
                {enableProductSearch ? <ShoppingBag className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                <span>{enableProductSearch ? 'สินค้า ON' : 'สินค้า OFF'}</span>
              </button>
              
              <button
                onClick={toggleWebSearch}
                className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                  enableWebSearch 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={enableWebSearch ? "ปิดการเปรียบเทียบเว็บ" : "เปิดการเปรียบเทียบเว็บ"}
                disabled={!enableProductSearch}
              >
                <span className="text-xs">🌐</span>
                <span>{enableWebSearch ? 'เว็บ ON' : 'เว็บ OFF'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="ล้างการสนทนา"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeChat}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">สวัสดี! ฉันเป็น AI Assistant ที่จะช่วยคุณใช้งาน RentEase</p>
              <p className="text-xs mt-2">ลองถามเกี่ยวกับการเช่าสินค้า, การใช้งานระบบ, หรือปัญหาต่างๆ</p>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                <p className="text-xs font-semibold text-blue-800 mb-1">💡 คำแนะนำ:</p>
                <p className="text-xs text-blue-700">
                  {enableProductSearch 
                    ? (enableWebSearch 
                        ? "✅ เปิดใช้งานการค้นหาสินค้าและเปรียบเทียบเว็บแล้ว! ลองถาม 'เปรียบเทียบราคากล้อง' หรือ 'กล้องในตลาดราคาเท่าไหร่'"
                        : "✅ เปิดใช้งานการค้นหาสินค้าแล้ว! ลองถามว่า 'อยากเช่าอะไรดี' หรือ 'มีกล้องให้เช่าไหม' (เปิด 🌐 เพื่อเปรียบเทียบราคาเว็บ)")
                    : "🔍 กดปุ่ม 'สินค้า' เพื่อให้ AI ช่วยแนะนำสินค้าได้"
                  }
                </p>
                
                <div className="mt-2 text-xs text-blue-600">
                  <p className="font-medium">ตัวอย่างคำถาม:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>"มีอะไรให้เช่าบ้าง"</li>
                    <li>"แนะนำกล้องหน่อย"</li>
                    <li>"เช่าโทรศัพท์ราคาเท่าไหร่"</li>
                    {enableWebSearch && (
                      <>
                        <li>"เปรียบเทียบราคากล้อง"</li>
                        <li>"กล้องในตลาดราคาเท่าไหร่"</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    renderMessageContent(message.content)
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {aiChatService.formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-2">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="พิมพ์ข้อความของคุณ..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatWidget;
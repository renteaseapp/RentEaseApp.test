import { GoogleGenerativeAI } from '@google/generative-ai';

// Vite environment variables type definitions
declare global {
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    readonly MODE: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'model' | 'function' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ระบบ prompt สำหรับ AI Assistant
const SYSTEM_PROMPT = `คุณเป็น AI Assistant สำหรับแพลตฟอร์ม RentEase ซึ่งเป็นระบบเช่า-ให้เช่าสินค้าออนไลน์

ข้อมูลเกี่ยวกับระบบ:
- เป็นแพลตฟอร์ม Marketplace สำหรับเช่า-ให้เช่าสินค้าออนไลน์
- มีบทบาท: ผู้เช่า, เจ้าของสินค้า, แอดมิน
- ฟีเจอร์หลัก: ค้นหาสินค้า, จองเช่า, ระบบแชท, การชำระเงิน, รีวิว, ร้องเรียน
- รองรับภาษาไทยและอังกฤษ

หน้าที่ของคุณ:
1. ช่วยตอบคำถามเกี่ยวกับการใช้งานระบบ
2. อธิบายขั้นตอนการเช่าสินค้า
3. ช่วยแก้ไขปัญหาการใช้งาน
4. ให้คำแนะนำเกี่ยวกับการเป็นผู้ให้เช่าหรือผู้เช่า
5. อธิบายนโยบายและเงื่อนไขต่างๆ
6. ช่วยในการค้นหาสินค้า

กรุณาตอบคำถามด้วยภาษาไทยและให้คำแนะนำที่เป็นประโยชน์และเป็นมิตรกับผู้ใช้

หมายเหตุ: คุณใช้ Google Gemini 2.0 Flash Exp model ซึ่งมีความสามารถในการเข้าใจภาษาไทยและให้คำแนะนำที่แม่นยำ`;

export class AIChatService {
  private static instance: AIChatService;
  private genAI: GoogleGenerativeAI;
  private model: any;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  private constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    console.log('AI Chat Service initialized with Gemini API Key:', apiKey ? 'Configured' : 'Not configured');
    console.log('Environment variable length:', import.meta.env.VITE_GEMINI_API_KEY?.length || 0);
    console.log('Environment:', import.meta.env.MODE);
    console.log('All env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  public static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  public async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    retryCount: number = 0
  ): Promise<ChatResponse> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    console.log('Current Gemini API Key:', apiKey ? 'Set' : 'Not set');
    console.log('Environment variable:', import.meta.env.VITE_GEMINI_API_KEY ? 'Found' : 'Not found');
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('API Key length:', apiKey.length);
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Google Gemini API key is not configured. Please create a .env.local file with VITE_GEMINI_API_KEY=your_actual_api_key. See GEMINI_SETUP.md for setup instructions.');
    }

    if (apiKey.length < 20) {
      throw new Error('API Key seems too short. Please check your Google Gemini API key');
    }

    try {
      // Rate limiting check
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Rate limiting: Waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Reset request count if more than 1 minute has passed
      if (now - this.lastRequestTime > 60000) {
        this.requestCount = 0;
      }
      
      if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
        throw new Error('Rate limit: Too many requests. Please wait a minute before trying again.');
      }
      
      this.lastRequestTime = now;
      this.requestCount++;

      // Prepare Gemini-compliant history (role must be one of: "user","model","function","system")
      const normalizeRole = (role: string): 'user' | 'model' | 'function' | 'system' => {
        switch (role) {
          case 'assistant':
          case 'model':
          case 'bot':
            return 'model';
          case 'user':
            return 'user';
          case 'function':
            return 'function';
          case 'system':
            return 'system';
          default:
            return 'user';
        }
      };

      console.log('Sending request to Google Gemini with API Key:', apiKey.substring(0, 10) + '...');
      console.log('Full API Key length:', apiKey.length);
      console.log('Request count this minute:', this.requestCount);
      
      // สร้าง chat session
      const chat = this.model.startChat({
        history: [
          // Include a system instruction as a model-safe first turn (Gemini supports "system" in some SDKs,
          // but to be safe we send it as an initial "user" instruction or prepend it in the first turn).
          // Here we add as a "user" system instruction to steer behavior consistently.
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          ...conversationHistory.map(msg => ({
            role: normalizeRole(msg.role),
            parts: [{ text: msg.content }]
          }))
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000000,
        },
      });

      // ส่งข้อความไปยัง Gemini
      const result = await chat.sendMessage([{ text: message }]);
      const response_text = result.response.text();

      // Convert Gemini response to our ChatResponse format
      const response: ChatResponse = {
        choices: [{
          message: {
            content: response_text,
            role: 'model'
          }
        }],
        usage: {
          prompt_tokens: 0, // Gemini doesn't provide token usage in the same way
          completion_tokens: 0,
          total_tokens: 0
        }
      };

      return response;
    } catch (error: any) {
      console.error('AI Chat API Error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error code:', error.code);
      
      // Handle specific error cases
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('authentication')) {
        console.error('Authentication failed - API Key might be invalid');
        console.error('API Key being used:', apiKey.substring(0, 20) + '...');
        throw new Error('Authentication failed. Please check your Google Gemini API key');
      } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.error('Rate Limit - Too many requests');
        
        // Retry logic for rate limiting
        if (retryCount < 3) {
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`Retrying in ${waitTime}ms (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.sendMessage(message, conversationHistory, retryCount + 1);
        }
        
        throw new Error('Rate limit exceeded. Please wait a few minutes and try again');
      } else if (error.message?.includes('content') || error.message?.includes('safety')) {
        console.error('Content Policy - Request blocked');
        throw new Error('ข้อความของคุณถูกบล็อกโดยนโยบายความปลอดภัย กรุณาลองใหม่');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        throw new Error('Network error. Please check your internet connection');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Gemini');
      }
    }
  }

  public generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const aiChatService = AIChatService.getInstance();

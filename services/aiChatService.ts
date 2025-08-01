import axios from 'axios';

// Vite environment variables type definitions
declare global {
  interface ImportMetaEnv {
    readonly VITE_OPENROUTER_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  private constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    console.log('AI Chat Service initialized with API Key:', this.apiKey ? 'Configured' : 'Not configured');
    console.log('Environment variable length:', import.meta.env.VITE_OPENROUTER_API_KEY?.length || 0);
    console.log('API Key starts with sk-or-v1-:', this.apiKey.startsWith('sk-or-v1-'));
  }

  public static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  public async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    console.log('Current API Key:', this.apiKey ? 'Set' : 'Not set');
    console.log('Environment variable:', import.meta.env.VITE_OPENROUTER_API_KEY ? 'Found' : 'Not found');
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured. Please check your .env file');
    }

    try {
      // สร้าง messages array สำหรับ API
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

             const response = await axios.post(
         `${this.baseURL}/chat/completions`,
         {
           model: 'google/gemini-2.0-flash-exp:free',
           messages,
           max_tokens: 1000000,
           temperature: 0.7,
           stream: false
         },
         {
           headers: {
             'Authorization': `Bearer ${this.apiKey}`,
             'Content-Type': 'application/json',
             'HTTP-Referer': window.location.origin,
             'X-Title': 'RentEase AI Assistant'
           }
         }
       );

      return response.data;
    } catch (error: any) {
      console.error('AI Chat API Error:', error);
      throw new Error(
        error.response?.data?.error?.message || 
        'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI Assistant'
      );
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
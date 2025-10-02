import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAgentMemory, ConversationMessage, AgentThought, ProductMemory } from './aiAgentMemory';
import { searchProducts, getFeaturedProducts, getPopularProducts, getCategories, getProvinces } from './productService';
import { ProductSearchParams } from '../types';

export interface AIAgentResponse {
  id: string;
  content: string;
  timestamp: Date;
  thoughts: AgentThought[];
  products?: ProductMemory[];
  confidence: number;
  intent: string;
  entities: string[];
}

export interface AIAgentConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  memoryEnabled: boolean;
  thoughtProcessEnabled: boolean;
}

export class AIAgentService {
  private static instance: AIAgentService;
  private genAI: GoogleGenerativeAI | null = null;
  private memory: AIAgentMemory;
  private config: AIAgentConfig;
  private isInitialized = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  private constructor() {
    this.memory = AIAgentMemory.getInstance();
    this.config = {
      apiKey: '',
      model: 'gemini-2.5-flash-lite',
      temperature: 0.7,
      maxTokens: 128,
      memoryEnabled: true,
      thoughtProcessEnabled: true
    };
    this.initializeKnowledgeBase();
  }

  public static getInstance(): AIAgentService {
    if (!AIAgentService.instance) {
      AIAgentService.instance = new AIAgentService();
    }
    return AIAgentService.instance;
  }

  public async initialize(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key provided');
    }

    this.config.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.isInitialized = true;

    // Load initial product data into memory
    await this.loadProductKnowledge();
  }

  private async initializeKnowledgeBase(): Promise<void> {
    try {
      // Load categories and provinces
      const [categoriesResponse, provincesResponse] = await Promise.all([
        getCategories(),
        getProvinces()
      ]);

      categoriesResponse.data.forEach(category => {
        this.memory.addCategory(category);
      });

      provincesResponse.data.forEach(province => {
        this.memory.addProvince(province);
      });

    } catch (error) {
      console.warn('Failed to initialize knowledge base:', error);
    }
  }

  private async loadProductKnowledge(): Promise<void> {
    try {
      console.log('🔄 Loading product knowledge from API...');
      
      // Load featured and popular products
      const [featuredResponse, popularResponse] = await Promise.all([
        getFeaturedProducts(20),
        getPopularProducts(20)
      ]);

      console.log('📦 Featured products:', featuredResponse.data.length);
      console.log('⭐ Popular products:', popularResponse.data.length);

      const allProducts = [
        ...featuredResponse.data,
        ...popularResponse.data
      ];

      // Remove duplicates
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );

      console.log(`✅ Loaded ${uniqueProducts.length} products from API`);
    } catch (error) {
      console.error('❌ Failed to load product knowledge:', error);
    }
  }

  public async sendMessage(
    message: string, 
    sessionId: string = 'default'
  ): Promise<AIAgentResponse> {
    if (!this.isInitialized || !this.genAI) {
      throw new Error('AI Agent not initialized. Please provide API key.');
    }

    // Rate limiting
    await this.enforceRateLimit();

    try {
      // Add user message to memory
      const userMessage: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      this.memory.addMessage(sessionId, userMessage);

      // Analyze user intent and extract entities
      const analysis = await this.analyzeUserIntent(message);
      
      // Generate agent thoughts
      const thoughts = await this.generateThoughts(analysis, sessionId);
      
      // Search for relevant products if needed, or load featured products for context
      let relevantProducts: ProductMemory[] = [];
      if (analysis.intent === 'product_search' || analysis.intent === 'product_inquiry' || analysis.intent === 'product_recommendation') {
        relevantProducts = await this.searchRelevantProducts(message, analysis.entities);
      }

      // If no relevant products found and intent is product_recommendation, load some featured products
      if (relevantProducts.length === 0 && analysis.intent === 'product_recommendation') {
        try {
          const featuredResponse = await getFeaturedProducts(5);
          relevantProducts = featuredResponse.data.map(product => ({
            id: product.id,
            title: product.title,
            description: product.description || '',
            category: product.category?.name || '',
            price: product.rental_price_per_day,
            location: product.province?.name_th || '',
            images: product.primary_image ? [product.primary_image.image_url] : [],
            specifications: product.specifications || {},
            owner: product.owner?.username || '',
            rating: product.average_rating || 0,
            availability: product.availability_status || 'unknown',
            lastUpdated: new Date()
          }));
          console.log('Loaded featured products for recommendation:', relevantProducts.length);
        } catch (error) {
          console.warn('Failed to load featured products for recommendation:', error);
        }
      }

      // Generate response using AI with context
      const response = await this.generateResponse(message, sessionId, thoughts, relevantProducts);

      // Filter products based on AI response
      const finalProducts = relevantProducts.filter(p => response.productIds?.includes(p.id.toString()));

      // Add agent message to memory
      const agentMessage: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'agent',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          intent: analysis.intent,
          entities: analysis.entities,
          products: finalProducts.map(p => p.id),
          confidence: response.confidence
        }
      };
      this.memory.addMessage(sessionId, agentMessage);

      // Store thoughts in memory using the existing addThought method
      thoughts.forEach(thought => {
        const fullThought: AgentThought = {
          ...thought,
          id: this.generateMessageId(),
          timestamp: new Date()
        };
        this.memory.addThought(fullThought);
      });

      // Convert thoughts to full AgentThought objects for response
      const fullThoughts: AgentThought[] = thoughts.map(thought => ({
        ...thought,
        id: this.generateMessageId(),
        timestamp: new Date()
      }));

      return {
        id: this.generateMessageId(),
        content: response.content,
        timestamp: new Date(),
        thoughts: fullThoughts,
        products: finalProducts,
        confidence: response.confidence,
        intent: analysis.intent,
        entities: analysis.entities
      };

    } catch (error) {
      console.error('Error in AI Agent:', error);
      throw new Error('Failed to process message. Please try again.');
    }
  }

  private async analyzeUserIntent(message: string): Promise<{
    intent: string;
    entities: string[];
    confidence: number;
  }> {
    try {
      // Use AI to analyze intent instead of hardcoded rules
      const intentAnalysisPrompt = `
        Analyze the user's message and determine their intent. Return ONLY a JSON object with:
        - intent: one of ["product_search", "product_recommendation", "product_inquiry", "price_inquiry", "rental_inquiry", "product_comparison", "general"]
        - confidence: number between 0.0 and 1.0
        
        Intent definitions:
        - product_search: User is searching for specific products
        - product_recommendation: User wants product recommendations or suggestions
        - product_inquiry: User asks what products are available in general
        - price_inquiry: User asks about pricing
        - rental_inquiry: User asks about rental process
        - product_comparison: User wants to compare products
        - general: General conversation or unclear intent
        
        User message: "${message}"
        
        Return ONLY valid JSON without any markdown formatting or code blocks.
      `;

      const model = this.genAI?.getGenerativeModel({ model: this.config.model });
      if (!model) {
        throw new Error('AI model not initialized');
      }

      const result = await model.generateContent(intentAnalysisPrompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up the response text - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(text);
      } catch (parseError) {
        console.warn('Failed to parse AI intent analysis, falling back to rules');
        console.error('AI intent analysis failed, using fallback rules:', parseError);
        throw parseError;
      }

      // Entity extraction (keep existing logic)
      const entities: string[] = [];
      const categories = this.memory.getCategories();
      const provinces = this.memory.getProvinces();

      // Extract category entities
      categories.forEach(category => {
        if (message.includes(category.name) || 
            (category.name_en && message.includes(category.name_en))) {
          entities.push(category.name);
        }
      });

      // Extract location entities
      provinces.forEach(province => {
        if (message.includes(province.name_th) ||
            (province.name_en && message.includes(province.name_en))) {
          entities.push(province.name_th);
        }
      });

      // Extract price entities
      const priceMatch = message.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
      if (priceMatch) {
        entities.push(...priceMatch.map(price => `price:${price}`));
      }

      return { 
        intent: aiAnalysis.intent || 'general', 
        entities, 
        confidence: aiAnalysis.confidence || 0.5 
      };

    } catch (error) {
      console.warn('AI intent analysis failed, using fallback rules:', error);
      
      // Fallback to rule-based analysis
      let intent = 'general';
      let confidence = 0.5;
      
      if (message.includes('หา') || message.includes('ค้นหา') || message.includes('search')) {
        intent = 'product_search';
        confidence = 0.8;
      } else if (message.includes('แนะนำ') || message.includes('recommend') ||
                 message.includes('เกม') || message.includes('game') ||
                 message.includes('เล่น') || message.includes('play')) {
        intent = 'product_recommendation';
        confidence = 0.8;
      } else if (message.includes('มีสินค้าอะไรบ้าง') || message.includes('มีอะไรบ้าง') || 
                 message.includes('สินค้าอะไรบ้าง') || message.includes('มีสินค้าไหนบ้าง') ||
                 message.includes('what products') || message.includes('show products')) {
        intent = 'product_inquiry';
        confidence = 0.9;
      } else if (message.includes('ราคา') || message.includes('price') || message.includes('เท่าไหร่')) {
        intent = 'price_inquiry';
        confidence = 0.7;
      } else if (message.includes('เช่า') || message.includes('rent')) {
        intent = 'rental_inquiry';
        confidence = 0.7;
      } else if (message.includes('เปรียบเทียบ') || message.includes('compare')) {
        intent = 'product_comparison';
        confidence = 0.7;
      }

      // Entity extraction
      const entities: string[] = [];
      const categories = this.memory.getCategories();
      const provinces = this.memory.getProvinces();

      // Extract category entities
      categories.forEach(category => {
        if (message.includes(category.name) || 
            (category.name_en && message.includes(category.name_en))) {
          entities.push(category.name);
        }
      });

      // Extract location entities
      provinces.forEach(province => {
        if (message.includes(province.name_th) ||
            (province.name_en && message.includes(province.name_en))) {
          entities.push(province.name_th);
        }
      });

      // Extract price entities
      const priceMatch = message.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
      if (priceMatch) {
        entities.push(...priceMatch.map(price => `price:${price}`));
      }

      return { intent, entities, confidence };
    }
  }

  private async generateThoughts(
    analysis: any, 
    sessionId: string
  ): Promise<Omit<AgentThought, 'id' | 'timestamp'>[]> {
    const thoughts: Omit<AgentThought, 'id' | 'timestamp'>[] = [];

    // Analysis thought
    thoughts.push({
      type: 'analysis',
      content: `ผู้ใช้ต้องการ: ${analysis.intent}, เอนทิตี้ที่พบ: ${analysis.entities.join(', ')}`,
      confidence: analysis.confidence,
      relatedProducts: []
    });

    // Context consideration
    const context = this.memory.getConversationContext(sessionId);
    if (context.messages.length > 1) {
      const recentMessages = context.messages.slice(-3);
      thoughts.push({
        type: 'analysis',
        content: `พิจารณาบริบทการสนทนา: ${recentMessages.length} ข้อความล่าสุด`,
        confidence: 0.8,
        relatedProducts: []
      });
    }

    // User preference consideration
    if (context.userPreferences.preferredCategories.length > 0) {
      thoughts.push({
        type: 'recommendation',
        content: `ผู้ใช้มีความสนใจในหมวดหมู่: ${context.userPreferences.preferredCategories.join(', ')}`,
        confidence: 0.9,
        relatedProducts: []
      });
    }

    return thoughts;
  }

  private async searchRelevantProducts(
    message: string, 
    entities: string[]
  ): Promise<ProductMemory[]> {
    let products: ProductMemory[] = [];

    console.log('🔍 Searching for products with message:', message);
    console.log('🏷️ Entities found:', entities);

    try {
      // Always fetch fresh data from API for real-time results
      console.log('🔄 Fetching fresh product data from API using semantic search...');
      
      const searchParams: ProductSearchParams = {
        search: message,
        limit: 10
      };

      // Add entity-based filters
      const categories = this.memory.getCategories().map(c => c.name);
      const provinces = this.memory.getProvinces().map(p => p.name_th);

      entities.forEach(entity => {
        if (categories.includes(entity)) {
          searchParams.category = entity;
        } else if (provinces.includes(entity)) {
          searchParams.province = entity;
        } else if (entity.startsWith('price:')) {
          const priceRange = entity.replace('price:', '');
          const priceMatch = priceRange.match(/(\d+)-(\d+)/);
          if (priceMatch) {
            searchParams.min_price = parseInt(priceMatch[1], 10);
            searchParams.max_price = parseInt(priceMatch[2], 10);
          }
        }
      });

      const searchResponse = await searchProducts(searchParams);
      
      if (searchResponse.data && searchResponse.data.length > 0) {
        products = searchResponse.data.map(product => ({
          id: product.id,
          title: product.title,
          description: product.description || '',
          category: product.category?.name || '',
          price: product.rental_price_per_day,
          location: product.province?.name_th || '',
          images: product.primary_image ? [product.primary_image.image_url] : [],
          specifications: product.specifications || {},
          owner: product.owner?.username || '',
          rating: product.average_rating || 0,
          availability: product.availability_status || 'unknown',
          lastUpdated: new Date()
        }));
        
        console.log('🔍 Search API results:', products.length);
      }

      console.log('✅ Final products to return:', JSON.stringify(products, null, 2));
      return products;

    } catch (error) {
      console.error('❌ Error in searchRelevantProducts:', error);
      return [];
    }
  }

  private async generateResponse(
    message: string,
    sessionId: string,
    thoughts: Omit<AgentThought, 'id' | 'timestamp'>[],
    relevantProducts: ProductMemory[]
  ): Promise<{ content: string; productIds: string[]; confidence: number }> {
    console.log('Products sent to AI:', JSON.stringify(relevantProducts, null, 2));
    
    // Retrieve conversation history
    const context = this.memory.getConversationContext(sessionId);
    const model = this.genAI!.getGenerativeModel({ model: this.config.model });

    // Build context for AI
    const systemPrompt = this.buildSystemPrompt();
    const conversationHistory = this.buildConversationHistory(context);
    const productContext = this.buildProductContext(relevantProducts);
    const thoughtContext = this.buildThoughtContext(thoughts);

    const fullPrompt = `${systemPrompt}

บริบทการสนทนา:
${conversationHistory}

ความคิดของ AI Agent:
${thoughtContext}

ข้อมูลสินค้าที่เกี่ยวข้อง (ใช้สำหรับอ้างอิงในการตอบ):
${productContext}

คำถามของผู้ใช้: ${message}

**คำสั่ง:**
1.  ตอบคำถามของผู้ใช้โดยใช้ข้อมูลที่มี และแสดงความคิดเห็นที่มีเหตุผล
2.  หากคำตอบมีการอ้างอิงถึงสินค้า ให้ระบุ ID ของสินค้าเหล่านั้นจากข้อมูลสินค้าที่ให้มา
3.  **ให้ตอบกลับเป็น JSON object เท่านั้น** ตามรูปแบบนี้:
    {
      "response_text": "<คำตอบของคุณ>",
      "relevant_product_ids": ["<id_สินค้า_1>", "<id_สินค้า_2>", ...]
    }
    - \`response_text\` คือคำตอบสำหรับผู้ใช้
    - \`relevant_product_ids\` คือ array ของ ID สินค้าที่ถูกกล่าวถึงใน \`response_text\` (ใช้ ID จากข้อมูลสินค้าที่ให้มาเท่านั้น ถ้าไม่มีให้เป็น array ว่าง)

`;

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
      });

      const response = result.response;
      const rawText = response.text();
      console.log('Raw AI Response:', rawText);
      
      // Clean and parse the JSON response
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedText);
      } catch (e) {
        // If parsing fails, use the raw text as the response content
        parsedResponse = { 
          response_text: cleanedText || "ขออภัยค่ะ ไม่สามารถประมวลผลคำตอบได้", 
          relevant_product_ids: [] 
        };
      }

      const content = parsedResponse.response_text || "ขออภัยค่ะ ไม่สามารถสร้างคำตอบได้ในขณะนี้";
      let productIds = parsedResponse.relevant_product_ids || [];

      console.log('AI returned product IDs:', productIds);

      // Map product titles to IDs if AI returned titles instead of IDs
      const mappedProductIds: string[] = productIds.map((id: any) => {
        if (typeof id === 'string' && isNaN(Number(id))) {
          // Assume it's a title, try to find matching product
          const cleanId = id.replace(/^[^a-zA-Z0-9]*/, ''); // Remove leading non-alphanumeric characters
          const matchingProduct = relevantProducts.find(p =>
            p.title === id ||
            p.title.includes(cleanId) ||
            cleanId.includes(p.title.split(' ')[0]) // Match first word
          );
          if (matchingProduct) {
            console.log(`Mapped title "${id}" to ID "${matchingProduct.id}"`);
            return matchingProduct.id.toString();
          } else {
            console.warn(`Could not map title "${id}" to any product ID`);
          }
        }
        return id.toString();
      });

      console.log('Mapped product IDs:', mappedProductIds);

      // Analyze response confidence
      const confidence = this.calculateResponseConfidence(content, mappedProductIds.length);

      return {
        content,
        productIds: mappedProductIds,
        confidence
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate response');
    }
  }

  private buildSystemPrompt(): string {
    return `คุณคือ AI Agent ที่ฉลาดและมีความจำ สำหรับแพลตฟอร์ม RentEase ซึ่งเป็นเว็บไซต์ให้เช่าสินค้าออนไลน์

บทบาทและความสามารถของคุณ:
1. มีความจำและสามารถจดจำบริบทการสนทนา
2. มีความคิดและสามารถวิเคราะห์ข้อมูล
3. สามารถค้นหาและแนะนำสินค้าได้อย่างแม่นยำ
4. เข้าใจความต้องการของผู้ใช้และให้คำแนะนำที่เหมาะสม
5. สามารถเปรียบเทียบสินค้าและให้เหตุผลที่ชัดเจน

หลักการตอบคำถาม:
- ใช้ภาษาไทยที่เป็นมิตรและเข้าใจง่าย
- ตอบสั้นๆ กระชับ ไม่เกิน 2-3 ประโยค
- ไม่ถามคำถามย้อนกลับมากเกินไป (ไม่เกิน 1 คำถาม)
- แสดงความคิดและเหตุผลในการแนะนำอย่างสั้นๆ
- อ้างอิงข้อมูลจากความจำและฐานข้อมูลสินค้า
- เมื่อผู้ใช้ถามเกี่ยวกับเกม ให้แนะนำสินค้าที่เกี่ยวข้องกับการเล่นเกม กีฬา หรือความบันเทิง
- ถ้าไม่มีสินค้าที่เกี่ยวข้องโดยตรง ให้แนะนำสินค้าทั่วไปที่น่าสนใจ

**สำคัญ**: 
- เมื่อมีสินค้าที่เกี่ยวข้อง อย่าแสดงรายละเอียดสินค้าในข้อความ แต่ให้อ้างอิงว่า "ดูสินค้าที่แนะนำด้านล่าง"
- ให้คำแนะนำสั้นๆ และอธิบายเหตุผลที่เลือกสินค้าเหล่านั้น
- อย่าบอกว่า "ไม่มีสินค้า" หรือ "ไม่พบสินค้า" เว้นแต่จะไม่มีสินค้าเลยในระบบ ให้พยายามแนะนำสินค้าที่มีอยู่เสมอ
- หลีกเลี่ยงการใช้รายการแบบ bullet points หรือการแจกแจงยาวๆ`;
  }

  private buildConversationHistory(context: any): string {
    const recentMessages = context.messages.slice(-6); // Last 6 messages
    return recentMessages.map((msg: ConversationMessage) => 
      `${msg.role === 'user' ? 'ผู้ใช้' : 'AI Agent'}: ${msg.content}`
    ).join('\n');
  }

  private buildProductContext(products: ProductMemory[]): string {
    if (products.length === 0) return 'ไม่มีสินค้าที่เกี่ยวข้อง';

    return products.map(product =>
      `- ID: ${product.id}, ${product.title} (${product.category})
        ราคา: ${product.price} บาท/วัน
        สถานที่: ${product.location}
        คะแนน: ${product.rating}/5
        รายละเอียด: ${product.description.substring(0, 100)}...`
    ).join('\n\n');
  }

  private buildThoughtContext(thoughts: Omit<AgentThought, 'id' | 'timestamp'>[]): string {
    return thoughts.map(thought => 
      `[${thought.type}] ${thought.content} (ความมั่นใจ: ${Math.round(thought.confidence * 100)}%)`
    ).join('\n');
  }

  private calculateResponseConfidence(content: string, productCount: number): number {
    let confidence = 0.5;
    
    // Increase confidence if products are mentioned
    if (productCount > 0) confidence += 0.2;
    
    // Increase confidence based on content length and structure
    if (content.length > 100) confidence += 0.1;
    if (content.includes('เพราะ') || content.includes('เนื่องจาก')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private extractIntentFromResponse(content: string): string {
    if (content.includes('แนะนำ')) return 'recommendation';
    if (content.includes('ค้นหา')) return 'search';
    if (content.includes('เปรียบเทียบ')) return 'comparison';
    if (content.includes('ราคา')) return 'price_info';
    
    return 'general';
  }

  // Rate limiting
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset request count every minute
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
    }
    
    // Check rate limits
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }
    
    // Enforce minimum interval
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for external use
  public async refreshProductKnowledge(): Promise<void> {
    await this.loadProductKnowledge();
  }

  public async searchProducts(query: string, filters?: ProductSearchParams): Promise<ProductMemory[]> {
    try {
      const apiResults = await searchProducts({
        q: query,
        ...filters,
        limit: 20 // Fetch a decent number of results
      });

      // Map API response to ProductMemory format
      const products = apiResults.data.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description || '',
        category: product.category?.name || '',
        price: product.rental_price_per_day,
        location: product.province?.name_th || '',
        images: product.primary_image ? [product.primary_image.image_url] : [],
        specifications: product.specifications || {},
        owner: product.owner?.username || '',
        rating: product.average_rating || 0,
        availability: product.availability_status || 'unknown',
        lastUpdated: new Date()
      }));

      return products;
    } catch (error) {
      console.error('Failed to fetch products from API:', error);
      return [];
    }
  }

  public getMemoryStats() {
    return this.memory.getMemoryStats();
  }

  public clearMemory(): void {
    this.memory.clearAllMemory();
  }

  public getConversationHistory(sessionId: string): ConversationMessage[] {
    const context = this.memory.getConversationContext(sessionId);
    return context.messages;
  }

  public getRecentThoughts(limit: number = 10): AgentThought[] {
    return this.memory.getRecentThoughts(limit);
  }
}

export default AIAgentService;
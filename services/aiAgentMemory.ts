import { Product, Category, Province } from '../types';

// Memory interfaces
export interface ProductMemory {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  images: string[];
  specifications: Record<string, any>;
  owner: string;
  rating: number;
  availability: string;
  lastUpdated: Date;
}

export interface ConversationContext {
  id: string;
  userId?: string;
  sessionId: string;
  messages: ConversationMessage[];
  userPreferences: UserPreferences;
  searchHistory: SearchQuery[];
  productInteractions: ProductInteraction[];
  createdAt: Date;
  lastActivity: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: string[];
    products?: number[];
    confidence?: number;
  };
}

export interface UserPreferences {
  preferredCategories: string[];
  priceRange: { min: number; max: number };
  preferredLocations: string[];
  searchFilters: Record<string, any>;
  language: 'th' | 'en';
}

export interface SearchQuery {
  query: string;
  filters: Record<string, any>;
  results: number[];
  timestamp: Date;
  satisfaction?: number; // 1-5 rating
}

export interface ProductInteraction {
  productId: number;
  action: 'view' | 'inquire' | 'like' | 'compare';
  timestamp: Date;
  context?: string;
}

export interface AgentThought {
  id: string;
  type: 'analysis' | 'recommendation' | 'question' | 'clarification';
  content: string;
  confidence: number;
  relatedProducts: number[];
  timestamp: Date;
}

// Memory Manager Class
export class AIAgentMemory {
  private static instance: AIAgentMemory;
  private productMemory: Map<number, ProductMemory> = new Map();
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private categoryMemory: Map<number, Category> = new Map();
  private provinceMemory: Map<number, Province> = new Map();
  private agentThoughts: AgentThought[] = [];
  private memoryUpdateCallbacks: (() => void)[] = [];

  private constructor() {
    this.initializeMemory();
  }

  public static getInstance(): AIAgentMemory {
    if (!AIAgentMemory.instance) {
      AIAgentMemory.instance = new AIAgentMemory();
    }
    return AIAgentMemory.instance;
  }

  private async initializeMemory(): Promise<void> {
    // Load existing memory from localStorage if available
    this.loadFromStorage();
    
    // Set up periodic memory persistence
    setInterval(() => {
      this.saveToStorage();
    }, 30000); // Save every 30 seconds
  }

  // Product Memory Management
  public addProduct(product: Product): void {
    const productMemory: ProductMemory = {
      id: product.id,
      title: product.title,
      description: product.description || '',
      category: product.category?.name || '',
      price: product.rental_price_per_day,
      location: product.province?.name_th || '',
      images: product.images?.map(img => img.image_url) || [],
      specifications: product.specifications || {},
      owner: product.owner?.username || '',
      rating: product.average_rating || 0,
      availability: product.availability_status || 'unknown',
      lastUpdated: new Date()
    };

    this.productMemory.set(product.id, productMemory);
    this.notifyMemoryUpdate();
  }

  public addProducts(products: Product[]): void {
    products.forEach(product => this.addProduct(product));
  }

  public getProduct(id: number): ProductMemory | undefined {
    return this.productMemory.get(id);
  }

  public getAllProducts(): ProductMemory[] {
    return Array.from(this.productMemory.values());
  }

  public searchProducts(query: string, filters?: Record<string, any>): ProductMemory[] {
    const results: ProductMemory[] = [];
    const searchTerms = query.split(' ');

    for (const product of this.productMemory.values()) {
      let score = 0;
      
      // Title matching
      searchTerms.forEach(term => {
        if (product.title.includes(term)) score += 3;
        if (product.description.includes(term)) score += 2;
        if (product.category.includes(term)) score += 2;
      });

      // Apply filters
      if (filters) {
        if (filters.category && product.category !== filters.category) continue;
        if (filters.minPrice && product.price < filters.minPrice) continue;
        if (filters.maxPrice && product.price > filters.maxPrice) continue;
        if (filters.location && !product.location.includes(filters.location)) continue;
      }

      if (score > 0) {
        results.push(product);
      }
    }

    return results.sort((a, b) => b.rating - a.rating);
  }

  public getProductsByCategory(category: string): ProductMemory[] {
    return Array.from(this.productMemory.values())
      .filter(product => product.category.includes(category));
  }

  public getRecommendedProducts(userId?: string, limit: number = 5): ProductMemory[] {
    const context = userId ? this.getConversationContext(userId) : null;
    let products = Array.from(this.productMemory.values());

    if (context) {
      // Sort by user preferences and interaction history
      products = products.sort((a, b) => {
        let scoreA = a.rating;
        let scoreB = b.rating;

        // Boost score for preferred categories
        if (context.userPreferences.preferredCategories.includes(a.category)) scoreA += 2;
        if (context.userPreferences.preferredCategories.includes(b.category)) scoreB += 2;

        // Boost score for price range preference
        const priceRange = context.userPreferences.priceRange;
        if (a.price >= priceRange.min && a.price <= priceRange.max) scoreA += 1;
        if (b.price >= priceRange.min && b.price <= priceRange.max) scoreB += 1;

        return scoreB - scoreA;
      });
    } else {
      // Default sorting by rating and recency
      products = products.sort((a, b) => {
        const scoreA = a.rating + (Date.now() - a.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        const scoreB = b.rating + (Date.now() - b.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        return scoreB - scoreA;
      });
    }

    return products.slice(0, limit);
  }

  // Conversation Context Management
  public getConversationContext(sessionId: string): ConversationContext {
    if (!this.conversationContexts.has(sessionId)) {
      const newContext: ConversationContext = {
        id: sessionId,
        sessionId,
        messages: [],
        userPreferences: {
          preferredCategories: [],
          priceRange: { min: 0, max: 10000 },
          preferredLocations: [],
          searchFilters: {},
          language: 'th'
        },
        searchHistory: [],
        productInteractions: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.conversationContexts.set(sessionId, newContext);
    }

    const context = this.conversationContexts.get(sessionId)!;
    context.lastActivity = new Date();
    return context;
  }

  public addMessage(sessionId: string, message: ConversationMessage): void {
    const context = this.getConversationContext(sessionId);
    context.messages.push(message);
    
    // Keep only last 50 messages to prevent memory bloat
    if (context.messages.length > 50) {
      context.messages = context.messages.slice(-50);
    }

    this.notifyMemoryUpdate();
  }

  public addSearchQuery(sessionId: string, query: SearchQuery): void {
    const context = this.getConversationContext(sessionId);
    context.searchHistory.push(query);
    
    // Keep only last 20 searches
    if (context.searchHistory.length > 20) {
      context.searchHistory = context.searchHistory.slice(-20);
    }
  }

  public addProductInteraction(sessionId: string, interaction: ProductInteraction): void {
    const context = this.getConversationContext(sessionId);
    context.productInteractions.push(interaction);
    
    // Update user preferences based on interactions
    this.updateUserPreferences(sessionId, interaction);
  }

  private updateUserPreferences(sessionId: string, interaction: ProductInteraction): void {
    const context = this.getConversationContext(sessionId);
    const product = this.getProduct(interaction.productId);
    
    if (product && (interaction.action === 'like' || interaction.action === 'inquire')) {
      // Add to preferred categories
      if (!context.userPreferences.preferredCategories.includes(product.category)) {
        context.userPreferences.preferredCategories.push(product.category);
      }
      
      // Update price range preferences
      const currentRange = context.userPreferences.priceRange;
      if (product.price < currentRange.min || currentRange.min === 0) {
        currentRange.min = Math.max(0, product.price - 500);
      }
      if (product.price > currentRange.max) {
        currentRange.max = product.price + 500;
      }
    }
  }

  // Agent Thoughts Management
  public addThought(thought: Omit<AgentThought, 'id' | 'timestamp'>): void {
    const agentThought: AgentThought = {
      ...thought,
      id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.agentThoughts.push(agentThought);
    
    // Keep only last 100 thoughts
    if (this.agentThoughts.length > 100) {
      this.agentThoughts = this.agentThoughts.slice(-100);
    }
  }

  public getRecentThoughts(limit: number = 10): AgentThought[] {
    return this.agentThoughts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getThoughtsByType(type: AgentThought['type']): AgentThought[] {
    return this.agentThoughts.filter(thought => thought.type === type);
  }

  // Category and Province Memory
  public addCategory(category: Category): void {
    this.categoryMemory.set(category.id, category);
  }

  public addProvince(province: Province): void {
    this.provinceMemory.set(province.id, province);
  }

  public getCategories(): Category[] {
    return Array.from(this.categoryMemory.values());
  }

  public getProvinces(): Province[] {
    return Array.from(this.provinceMemory.values());
  }

  // Memory Statistics
  public getMemoryStats(): {
    totalProducts: number;
    totalConversations: number;
    totalThoughts: number;
    memorySize: string;
  } {
    const memorySize = this.calculateMemorySize();
    
    return {
      totalProducts: this.productMemory.size,
      totalConversations: this.conversationContexts.size,
      totalThoughts: this.agentThoughts.length,
      memorySize: `${(memorySize / 1024 / 1024).toFixed(2)} MB`
    };
  }

  private calculateMemorySize(): number {
    const data = {
      products: Array.from(this.productMemory.values()),
      conversations: Array.from(this.conversationContexts.values()),
      thoughts: this.agentThoughts,
      categories: Array.from(this.categoryMemory.values()),
      provinces: Array.from(this.provinceMemory.values())
    };
    
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  // Memory Persistence
  private saveToStorage(): void {
    try {
      const memoryData = {
        products: Array.from(this.productMemory.entries()),
        conversations: Array.from(this.conversationContexts.entries()),
        thoughts: this.agentThoughts,
        categories: Array.from(this.categoryMemory.entries()),
        provinces: Array.from(this.provinceMemory.entries()),
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('aiAgentMemory', JSON.stringify(memoryData));
    } catch (error) {
      console.warn('Failed to save AI Agent memory to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('aiAgentMemory');
      if (!stored) return;

      const memoryData = JSON.parse(stored);
      
      // Load products
      if (memoryData.products) {
        this.productMemory = new Map(memoryData.products);
      }
      
      // Load conversations
      if (memoryData.conversations) {
        this.conversationContexts = new Map(
          memoryData.conversations.map(([key, context]: [string, any]) => [
            key,
            {
              ...context,
              createdAt: new Date(context.createdAt),
              lastActivity: new Date(context.lastActivity),
              messages: context.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })),
              searchHistory: context.searchHistory.map((search: any) => ({
                ...search,
                timestamp: new Date(search.timestamp)
              })),
              productInteractions: context.productInteractions.map((interaction: any) => ({
                ...interaction,
                timestamp: new Date(interaction.timestamp)
              }))
            }
          ])
        );
      }
      
      // Load thoughts
      if (memoryData.thoughts) {
        this.agentThoughts = memoryData.thoughts.map((thought: any) => ({
          ...thought,
          timestamp: new Date(thought.timestamp)
        }));
      }
      
      // Load categories and provinces
      if (memoryData.categories) {
        this.categoryMemory = new Map(memoryData.categories);
      }
      if (memoryData.provinces) {
        this.provinceMemory = new Map(memoryData.provinces);
      }

    } catch (error) {
      console.warn('Failed to load AI Agent memory from localStorage:', error);
    }
  }

  // Memory Update Notifications
  public onMemoryUpdate(callback: () => void): void {
    this.memoryUpdateCallbacks.push(callback);
  }

  private notifyMemoryUpdate(): void {
    this.memoryUpdateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in memory update callback:', error);
      }
    });
  }

  // Memory Cleanup
  public clearOldMemory(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Clear old conversations
    for (const [sessionId, context] of this.conversationContexts.entries()) {
      if (context.lastActivity < cutoffDate) {
        this.conversationContexts.delete(sessionId);
      }
    }

    // Clear old thoughts
    this.agentThoughts = this.agentThoughts.filter(
      thought => thought.timestamp > cutoffDate
    );

    this.notifyMemoryUpdate();
  }

  public clearAllMemory(): void {
    this.productMemory.clear();
    this.conversationContexts.clear();
    this.agentThoughts = [];
    this.categoryMemory.clear();
    this.provinceMemory.clear();
    
    localStorage.removeItem('aiAgentMemory');
    this.notifyMemoryUpdate();
  }
}

export default AIAgentMemory;
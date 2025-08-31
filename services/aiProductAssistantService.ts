// Removed unused import: aiChatService
import { searchProducts, getFeaturedProducts, getPopularProducts, getCategories } from './productService';
import { Product, ProductSearchParams, Category } from '../types';

// Web Search Interface for external product comparison
interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  price?: string;
  source: string;
}

interface ProductComparison {
  localProducts: Product[];
  webResults: WebSearchResult[];
  comparisonSummary: string;
}

export interface ProductRecommendation {
  products: Product[];
  query: string;
  totalFound: number;
  categories: string[];
}

export interface CategoryMapping {
  [key: string]: number;
}

export interface AIProductContext {
  enableProductSearch: boolean;
  lastQuery: string;
  lastResults: Product[];
}

class AIProductAssistantService {
  private static instance: AIProductAssistantService;
  private productContext: AIProductContext = {
    enableProductSearch: false,
    lastQuery: '',
    lastResults: []
  };
  private categoryMapping: CategoryMapping = {};
  private categoriesLoaded: boolean = false;
  private webSearchEnabled: boolean = false;

  private constructor() {}

  public static getInstance(): AIProductAssistantService {
    if (!AIProductAssistantService.instance) {
      AIProductAssistantService.instance = new AIProductAssistantService();
    }
    return AIProductAssistantService.instance;
  }

  public toggleProductSearch(): boolean {
    this.productContext.enableProductSearch = !this.productContext.enableProductSearch;
    return this.productContext.enableProductSearch;
  }

  public isProductSearchEnabled(): boolean {
    return this.productContext.enableProductSearch;
  }

  public toggleWebSearch(): boolean {
    this.webSearchEnabled = !this.webSearchEnabled;
    return this.webSearchEnabled;
  }

  public isWebSearchEnabled(): boolean {
    return this.webSearchEnabled;
  }

  private async loadCategories(): Promise<void> {
    if (this.categoriesLoaded) return;
    
    try {
      console.log('🏷️ Loading categories from API...');
      const response = await getCategories();
      const categories = response.data || [];
      
      // Build dynamic category mapping
      this.categoryMapping = {};
      categories.forEach((category: Category) => {
        if (category.name) {
          this.categoryMapping[category.name.toLowerCase()] = category.id;
        }
        if (category.name_en) {
          this.categoryMapping[category.name_en.toLowerCase()] = category.id;
        }
      });
      
      console.log('✅ Categories loaded:', Object.keys(this.categoryMapping));
      this.categoriesLoaded = true;
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      // Fallback to hardcoded mapping if API fails
      this.categoryMapping = {
        'กล้อง': 1, 'camera': 1,
        'โทรศัพท์': 2, 'phone': 2, 'มือถือ': 2,
        'คอมพิวเตอร์': 3, 'computer': 3, 'laptop': 3,
        'เครื่องเสียง': 4, 'audio': 4,
        'เกม': 5, 'game': 5,
        'กีฬา': 6, 'sports': 6,
        'เครื่องครัว': 7, 'kitchen': 7,
        'เครื่องมือ': 8, 'tools': 8,
        'เฟอร์นิเจอร์': 9, 'furniture': 9,
        'แฟชั่น': 10, 'fashion': 10
      };
      this.categoriesLoaded = true;
    }
  }

  // Note: checkProductAvailability method removed as it was unused

  public async processMessageWithProducts(
    message: string
  ): Promise<string> {
    try {
      console.log('🎯 Processing user message for products:', message);
      
      // Load categories first
      await this.loadCategories();
      
      // Test API connectivity first
      console.log('🔍 Testing API connectivity...');
      try {
        const testResponse = await searchProducts({ limit: 1, page: 1 });
        console.log('✅ API test successful:', testResponse.data?.length || 0, 'products found');
        
        if (!testResponse.data || testResponse.data.length === 0) {
          console.log('⚠️ Database appears to be empty');
          return '\n\n📦 **ระบบพร้อมใช้งาน** แต่ยังไม่มีสินค้าในระบบ' +
                 '\n\n💡 **คำแนะนำ:** ติดต่อผู้ดูแลระบบเพื่อเพิ่มสินค้า';
        }
      } catch (apiError) {
        console.error('❌ API connection failed:', apiError);
        return '\n\n⚠️ **ไม่สามารถเชื่อมต่อกับระบบสินค้าได้**' +
               '\n\nกรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่อีกครั้ง';
      }

      if (!this.productContext.enableProductSearch) {
        console.log('🔍 Product search is disabled');
        return '';
      }

      // Analyze message for product intent
      const productIntent = this.analyzeProductIntent(message);
      console.log('🎯 Product intent analysis:', productIntent);
      
      if (productIntent.hasIntent) {
        const recommendations = await this.searchProducts(productIntent);
        
        if (recommendations.products.length > 0) {
          this.productContext.lastQuery = productIntent.query;
          this.productContext.lastResults = recommendations.products;
          
          return this.formatProductRecommendations(recommendations);
        } else {
          return this.formatNoProductsFound(productIntent.query);
        }
      }
      
      return '';
    } catch (error) {
      console.error('❌ Error processing message with products:', error);
      return '⚠️ **ไม่สามารถค้นหาสินค้าได้ในขณะนี้**\n\nกรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบหากปัญหายังคงเกิดขึ้น';
    }
  }

  private analyzeProductIntent(message: string): { hasIntent: boolean; query: string; category?: string } {
    const lowerMessage = message.toLowerCase();
    
    console.log('🔍 Analyzing intent for message:', message);
    


    // Comprehensive product keywords in Thai and English
    const productKeywords = [
      'กล้อง', 'camera', 'โทรศัพท์', 'phone', 'มือถือ', 'mobile',
      'คอมพิวเตอร์', 'computer', 'laptop', 'notebook', 'pc',
      'แท็บเล็ต', 'tablet', 'ipad',
      'เลนส์', 'lens', 'ขาตั้ง', 'tripod', 'ไฟ', 'light', 'flash',
      'เช่า', 'rent', 'rental',
      'สินค้า', 'product', 'items',
      'อุปกรณ์', 'device', 'equipment',
      'มีอะไร', 'what do you have', 'available',
      'แนะนำ', 'recommend', 'suggest',
      'ราคา', 'price', 'cost',
      'หา', 'find', 'search', 'looking for'
    ];

    // Check for product intent
    let hasIntent = false;
    let detectedQuery = '';
    let detectedCategory = '';

    // Enhanced category mapping with fuzzy matching
    const categoryMap: { [key: string]: string } = {
      'กล้อง': 'camera',
      'camera': 'camera',
      'canon': 'camera',
      'nikon': 'camera',
      'sony': 'camera',
      'fujifilm': 'camera',
      'โทรศัพท์': 'electronics',
      'phone': 'electronics',
      'มือถือ': 'electronics',
      'mobile': 'electronics',
      'iphone': 'electronics',
      'samsung': 'electronics',
      'xiaomi': 'electronics',
      'oppo': 'electronics',
      'vivo': 'electronics',
      'คอมพิวเตอร์': 'electronics',
      'computer': 'electronics',
      'laptop': 'electronics',
      'notebook': 'electronics',
      'macbook': 'electronics',
      'dell': 'electronics',
      'hp': 'electronics',
      'asus': 'electronics',
      'acer': 'electronics',
      'lenovo': 'electronics',
      'แท็บเล็ต': 'electronics',
      'tablet': 'electronics',
      'ipad': 'electronics',
      'เลนส์': 'electronics',
      'lens': 'electronics',
      'เครื่องเสียง': 'electronics',
      'audio': 'electronics',
      'microphone': 'electronics',
      'mic': 'electronics'
    };

    // Check for category keywords
    for (const [thaiKeyword, category] of Object.entries(categoryMap)) {
      if (lowerMessage.includes(thaiKeyword)) {
        hasIntent = true;
        detectedCategory = category;
        detectedQuery = thaiKeyword;
        console.log('✅ Category detected:', category, 'from keyword:', thaiKeyword);
        break;
      }
    }

    // Check for general product inquiries
    const generalInquiries = [
      'มีอะไรให้เช่า', 'มีสินค้าอะไร', 'แนะนำสินค้า',
      'อยากเช่าอะไรดี', 'what can i rent', 'recommend products',
      'show me products', 'available items', 'สินค้ามีอะไรบ้าง',
      'สวัสดี', 'เริ่มต้น', 'ช่วยแนะนำ', 'แนะนำหน่อย', 'มีอะไร', 'ดูสินค้า'
    ];

    for (const inquiry of generalInquiries) {
      if (lowerMessage.includes(inquiry.toLowerCase())) {
        hasIntent = true;
        detectedQuery = 'all';
        detectedCategory = 'all';
        console.log('✅ General inquiry detected');
        break;
      }
    }

    // If no specific category, check for product-related keywords
    if (!hasIntent) {
      const hasProductKeyword = productKeywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      
      if (hasProductKeyword) {
        hasIntent = true;
        detectedQuery = lowerMessage.replace(/[^\w\sก-๙]/g, '').trim();
        detectedCategory = 'all';
        console.log('✅ Product keyword detected, query:', detectedQuery);
      }
    }

    // If still no intent, but message is very short, assume it's a product query
    if (!hasIntent && lowerMessage.length <= 10 && lowerMessage.length > 0) {
      hasIntent = true;
      detectedQuery = lowerMessage;
      detectedCategory = 'all';
      console.log('✅ Short message, treating as product query:', detectedQuery);
    }

    // Clean up query
    if (detectedQuery && detectedQuery !== 'all') {
      detectedQuery = detectedQuery
        .replace(/^(แนะนำ|หา|ค้นหา|อยากได้|ต้องการ|เช่า|ดู|มี)/gi, '')
        .replace(/(ไหม|บ้าง|หน่อย|สินค้า|ของ|อุปกรณ์)/gi, '')
        .trim();
      
      if (!detectedQuery || detectedQuery.length < 2) {
        detectedQuery = 'all';
      }
    }

    console.log('🎯 Final intent analysis:', { hasIntent, query: detectedQuery, category: detectedCategory });
    
    return {
      hasIntent,
      query: detectedQuery || 'all',
      category: detectedCategory || 'all'
    };
  }

  private async searchProducts(intent: { query: string; category?: string }): Promise<ProductRecommendation> {
    try {
      console.log('🔍 Starting product search...');
      console.log('Query:', intent.query, 'Category:', intent.category);
      
      let products: Product[] = [];
      
      // Extract individual words from query for broader search
      const queryWords = intent.query && intent.query !== 'all' 
        ? intent.query.toLowerCase().split(/\s+/).filter(word => word.length > 1)
        : [];
      
      // First try search with query
      if (intent.query && intent.query !== 'all') {
        const searchParams: ProductSearchParams = {
          q: intent.query,
          limit: 8,
          page: 1
        };
        
        if (intent.category && intent.category !== 'all') {
          const categoryId = this.mapCategoryToId(intent.category);
          if (categoryId) {
            searchParams.category_id = categoryId;
          }
        }
        
        console.log('📋 Search parameters:', searchParams);
        
        try {
          const result = await searchProducts(searchParams);
          products = result.data || [];
          console.log(`✅ Search results for "${intent.query}": ${products.length} products found`);
          
          // If no results with full query, try individual words
          if (products.length === 0 && queryWords.length > 0) {
            for (const word of queryWords) {
              const wordSearchParams: ProductSearchParams = {
                q: word,
                limit: 8,
                page: 1
              };
              
              if (intent.category && intent.category !== 'all') {
                const categoryId = this.mapCategoryToId(intent.category);
                if (categoryId) {
                  wordSearchParams.category_id = categoryId;
                }
              }
              
              const wordResult = await searchProducts(wordSearchParams);
              if (wordResult.data && wordResult.data.length > 0) {
                products = wordResult.data;
                console.log(`✅ Found products with word "${word}": ${products.length} products`);
                break;
              }
            }
          }
        } catch (error) {
          console.warn('❌ Search failed, trying fallback methods:', error);
        }
      }
      
      // If no products from search, try featured products
      if (products.length === 0) {
        try {
          const featured = await getFeaturedProducts(8);
          products = featured.data || [];
          console.log(`✅ Featured products: ${products.length} products found`);
        } catch (error) {
          console.warn('❌ Featured products failed, trying popular products:', error);
        }
      }
      
      // If still no products, try popular products
      if (products.length === 0) {
        try {
          const popular = await getPopularProducts(8);
          products = popular.data || [];
          console.log(`✅ Popular products: ${products.length} products found`);
        } catch (error) {
          console.warn('❌ Popular products failed:', error);
        }
      }
      
      console.log('📊 Final search result:', products.length, 'products');
      
      return {
        products: products.slice(0, 5),
        query: intent.query,
        totalFound: products.length,
        categories: [...new Set(products.map(p => p.category?.name || 'ไม่ระบุ'))]
      };
    } catch (error) {
      console.error('❌ Error searching products:', error);
      throw error;
    }
  }

  private mapCategoryToId(category: string): number | undefined {
    // Use dynamic category mapping if available
    if (this.categoryMapping && Object.keys(this.categoryMapping).length > 0) {
      const normalizedCategory = category.toLowerCase();
      
      // First try exact match
      if (this.categoryMapping[normalizedCategory]) {
        return this.categoryMapping[normalizedCategory];
      }
      
      // Then try partial match
      for (const [key, id] of Object.entries(this.categoryMapping)) {
        if (key.includes(normalizedCategory) || normalizedCategory.includes(key)) {
          return id;
        }
      }
    }
    
    // Fallback to hardcoded mapping
    const fallbackMapping: { [key: string]: number } = {
      'กล้อง': 1,
      'camera': 1,
      'โทรศัพท์': 2,
      'phone': 2,
      'คอมพิวเตอร์': 3,
      'computer': 3,
      'laptop': 3,
      'เครื่องเสียง': 4,
      'audio': 4,
      'เกม': 5,
      'game': 5,
      'กีฬา': 6,
      'sports': 6,
      'เครื่องครัว': 7,
      'kitchen': 7,
      'เครื่องมือ': 8,
      'tools': 8,
      'เฟอร์นิเจอร์': 9,
      'furniture': 9,
      'แฟชั่น': 10,
      'fashion': 10
    };
    
    return fallbackMapping[category.toLowerCase()];
  }

  private formatProductRecommendations(recommendations: ProductRecommendation): string {
    if (recommendations.products.length === 0) {
      return this.formatNoProductsFound(recommendations.query);
    }

    let response = `\n\n🔍 **ผลการค้นหา "${recommendations.query}"**\n`;
    response += `พบสินค้า ${recommendations.totalFound} รายการ\n\n`;

    recommendations.products.forEach((product, index) => {
      response += `${index + 1}. **${product.title}**\n`;
      response += `   💰 ราคา: ฿${product.rental_price_per_day}/วัน\n`;
      response += `   📍 จังหวัด: ${product.province?.name_th || 'ไม่ระบุ'}\n`;
      response += `   📦 มีให้เช่า: ${product.quantity_available || 1} ชิ้น\n`;
      
      // Add category information if available
      if (product.category?.name) {
        response += `   🏷️ หมวด: ${product.category.name}\n`;
      }
      
      if (product.description) {
        const shortDesc = product.description.length > 100 
          ? product.description.substring(0, 100) + '...' 
          : product.description;
        response += `   📝 ${shortDesc}\n`;
      }
      
      response += `   🔗 ดูรายละเอียด: /products/${product.slug}\n\n`;
    });

    if (recommendations.totalFound > 5) {
      response += `ℹ️ มีสินค้าเพิ่มเติม ${recommendations.totalFound - 5} รายการ ลองค้นหาด้วยคำที่เจาะจงมากขึ้น\n`;
    }

    return response;
  }

  private formatNoProductsFound(query: string): string {
    return `\n\n🔍 **ไม่พบสินค้าที่ตรงกับ "${query}"**\n\nอย่างไรก็ตาม คุณสามารถ:\n• ลองใช้คำค้นหาที่ต่างออกไป\n• ตรวจสอบหมวดหมู่สินค้าอื่นๆ\n• ดูสินค้าแนะนำทั้งหมด\n\n💡 **คำแนะนำ:** ลองถามว่า "มีสินค้าอะไรให้เช่าบ้าง" หรือ "แนะนำสินค้าหน่อย"`;
  }

  public getLastResults(): Product[] {
    return this.productContext.lastResults;
  }

  public getContext(): AIProductContext {
    return { ...this.productContext };
  }

  // Web Search functionality for product comparison
  private async searchWeb(query: string): Promise<WebSearchResult[]> {
    try {
      const API_URL = "https://api.search1api.com/search";
      
      const searchData = {
        query: `${query} ราคา เช่า rental price`,
        search_service: "google",
        max_results: 5,
        crawl_results: 2,
        language: "th",
        time_range: "month"
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Note: Using keyless free tier
        },
        body: JSON.stringify(searchData)
      });

      if (!response.ok) {
        throw new Error(`Web search failed: ${response.status}`);
      }

      const results = await response.json();
      
      return results.results?.map((result: any) => {
        let hostname = 'Unknown';
        try {
          if (result.url && result.url.trim()) {
            hostname = new URL(result.url).hostname;
          }
        } catch (e) {
          console.warn('Invalid URL:', result.url);
        }
        
        return {
          title: result.title || '',
          url: result.url || '',
          snippet: result.snippet || '',
          price: this.extractPrice(result.snippet || result.title || ''),
          source: hostname
        };
      }) || [];
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  private extractPrice(text: string): string | undefined {
    // Extract price patterns from Thai text
    const pricePatterns = [
      /([0-9,]+)\s*บาท/g,
      /฿\s*([0-9,]+)/g,
      /([0-9,]+)\s*THB/g,
      /([0-9,]+)\s*ต่อวัน/g,
      /([0-9,]+)\s*\/\s*วัน/g
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return undefined;
  }

  private filterMatchingWebResults(localProducts: Product[], webResults: WebSearchResult[]): WebSearchResult[] {
    if (localProducts.length === 0) {
      return webResults;
    }

    const matchedResults: WebSearchResult[] = [];
    
    for (const localProduct of localProducts) {
      const localKeywords = this.extractProductKeywords(localProduct.title);
      const localBrand = this.extractBrand(localProduct.title);
      const localModel = this.extractModel(localProduct.title);
      
      for (const webResult of webResults) {
        const webBrand = this.extractBrand(webResult.title);
        const webModel = this.extractModel(webResult.title);
        
        // Strict matching: both brand and model must match
        const brandMatch = localBrand && webBrand && 
          localBrand.toLowerCase() === webBrand.toLowerCase();
        const modelMatch = localModel && webModel && 
          (localModel.toLowerCase() === webModel.toLowerCase() ||
           localModel.toLowerCase().includes(webModel.toLowerCase()) ||
           webModel.toLowerCase().includes(localModel.toLowerCase()));
        
        if (brandMatch && modelMatch) {
          matchedResults.push({
            ...webResult,
            title: `${webResult.title} (รุ่นเดียวกัน: ${localProduct.title})`
          });
        }
      }
    }

    // If no exact matches found, return top 3 web results for general comparison
    return matchedResults.length > 0 ? matchedResults : webResults.slice(0, 3);
  }

  private extractBrand(title: string): string | null {
    const brands = ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Fuji', 'Olympus', 'Panasonic', 'Leica'];
    const brandMatch = brands.find(brand => 
      title.toLowerCase().includes(brand.toLowerCase())
    );
    return brandMatch || null;
  }

  private extractModel(title: string): string | null {
    // Extract model patterns like EOS R50, D850, A7III, X-T4, etc.
    const modelPatterns = [
      /EOS\s*[A-Z0-9]+/gi,  // Canon EOS models
      /[A-Z]+[0-9]+[A-Z]*/gi,  // General alphanumeric models
      /[A-Z]-[A-Z0-9]+/gi,  // Fuji X-T series
      /[0-9]+[A-Z]+/gi      // Models starting with numbers
    ];
    
    for (const pattern of modelPatterns) {
      const matches = title.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].replace(/\s+/g, ' ').trim();
      }
    }
    
    return null;
  }

  private extractProductKeywords(title: string): string[] {
    // Extract brand names, model numbers, and key product terms
    const keywords: string[] = [];
    
    const brand = this.extractBrand(title);
    if (brand) keywords.push(brand.toLowerCase());
    
    const model = this.extractModel(title);
    if (model) keywords.push(model.toLowerCase());
    
    // Product type keywords
    const productTypes = ['camera', 'lens', 'กล้อง', 'เลนส์', 'mirrorless', 'dslr'];
    productTypes.forEach(type => {
      if (title.toLowerCase().includes(type.toLowerCase())) {
        keywords.push(type.toLowerCase());
      }
    });
    
    return keywords;
  }

  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const intersection = keywords1.filter(k1 => 
      keywords2.some(k2 => k2.includes(k1) || k1.includes(k2))
    );
    
    return intersection.length / Math.max(keywords1.length, keywords2.length);
  }

  public async compareWithWeb(query: string): Promise<ProductComparison> {
    try {
      // Search local products
      const localIntent = this.analyzeProductIntent(query);
      const localRecommendations = await this.searchProducts(localIntent);
      
      // Search web if enabled
      let webResults: WebSearchResult[] = [];
      if (this.webSearchEnabled) {
        const allWebResults = await this.searchWeb(query);
        // Filter web results to match only similar products from local inventory
        webResults = this.filterMatchingWebResults(localRecommendations.products, allWebResults);
      }

      // Generate comparison summary
      const comparisonSummary = this.generateComparisonSummary(
        localRecommendations.products,
        webResults,
        query
      );

      return {
        localProducts: localRecommendations.products,
        webResults,
        comparisonSummary
      };
    } catch (error) {
      console.error('Product comparison error:', error);
      return {
        localProducts: [],
        webResults: [],
        comparisonSummary: `เกิดข้อผิดพลาดในการเปรียบเทียบสินค้า "${query}"`
      };
    }
  }

  private generateComparisonSummary(
    localProducts: Product[],
    webResults: WebSearchResult[],
    query: string
  ): string {
    let summary = `\n\n🔍 **การเปรียบเทียบสินค้า "${query}"**\n\n`;

    // Local products summary
    if (localProducts.length > 0) {
      summary += `📦 **ในระบบของเรา (${localProducts.length} รายการ):**\n`;
      localProducts.slice(0, 3).forEach(product => {
        summary += `• ${product.title} - ${product.rental_price_per_day} บาท/วัน\n`;
      });
      summary += `\n`;
    } else {
      summary += `📦 **ในระบบของเรา:** ไม่พบสินค้าที่ตรงกับการค้นหา\n\n`;
    }

    // Web results summary
    if (webResults.length > 0) {
      const hasMatchedResults = webResults.some(result => result.title.includes('คล้าย:'));
      if (hasMatchedResults) {
        summary += `🌐 **ในตลาดออนไลน์ - สินค้ารุ่นเดียวกัน (${webResults.length} รายการ):**\n`;
      } else {
        summary += `🌐 **ในตลาดออนไลน์ - สินค้าทั่วไป (${webResults.length} รายการ):**\n`;
      }
      webResults.slice(0, 5).forEach(result => {
        summary += `• ${result.title}${result.price ? ` - ${result.price}` : ''} (${result.source})\n`;
      });
      summary += `\n`;
    } else {
      summary += `🌐 **ในตลาดออนไลน์:** ไม่พบสินค้ารุ่นเดียวกันสำหรับเปรียบเทียบ\n\n`;
    }

    // Enhanced comparison insights
    if (localProducts.length > 0 && webResults.length > 0) {
      const hasMatchedResults = webResults.some(result => result.title.includes('คล้าย:'));
      if (hasMatchedResults) {
        summary += `🎯 **การเปรียบเทียบรุ่นเดียวกัน:**\n`;
        summary += `• เปรียบเทียบราคาเช่าต่อวันโดยตรง\n`;
        summary += `• ตรวจสอบสภาพและอายุการใช้งาน\n`;
        summary += `• พิจารณาบริการเสริม (อุปกรณ์เพิ่มเติม, การส่งมอบ)\n`;
        summary += `• เปรียบเทียบเงื่อนไขการประกันและความรับผิดชอบ\n`;
      } else {
        summary += `💡 **ข้อเสนอแนะทั่วไป:**\n`;
        summary += `• เปรียบเทียบราคาและเงื่อนไขการเช่า\n`;
        summary += `• ตรวจสอบรีวิวและคุณภาพสินค้า\n`;
        summary += `• พิจารณาระยะทางและความสะดวกในการรับส่ง\n`;
      }
    } else if (localProducts.length > 0) {
      summary += `✅ **ข้อดีของระบบเรา:**\n`;
      summary += `• มีสินค้าพร้อมให้เช่า\n`;
      summary += `• ระบบจองและชำระเงินที่ปลอดภัย\n`;
      summary += `• บริการหลังการขายที่เชื่อถือได้\n`;
    }

    return summary;
  }
}

export const aiProductAssistantService = AIProductAssistantService.getInstance();
// Simple test script to debug product search
import { searchProducts } from './services/productService.js';

async function testProductSearch() {
  console.log('🧪 Testing product search API...\n');
  
  try {
    // Test 1: Basic search
    console.log('1. Testing basic search...');
    const basicSearch = await searchProducts({ limit: 5 });
    console.log('✅ Basic search results:', basicSearch.data?.length || 0, 'products');
    console.log('📊 Sample data:', basicSearch.data?.slice(0, 2));
    
    // Test 2: Search with query
    console.log('\n2. Testing search with query "กล้อง"...');
    const cameraSearch = await searchProducts({ q: 'กล้อง', limit: 3 });
    console.log('✅ Camera search results:', cameraSearch.data?.length || 0, 'products');
    
    // Test 3: Search with category
    console.log('\n3. Testing featured products...');
    const featuredProducts = await import('./services/productService.js').then(m => m.getFeaturedProducts(3));
    console.log('✅ Featured products:', featuredProducts.data?.length || 0, 'products');
    
    // Test 4: Popular products
    console.log('\n4. Testing popular products...');
    const popularProducts = await import('./services/productService.js').then(m => m.getPopularProducts(3));
    console.log('✅ Popular products:', popularProducts.data?.length || 0, 'products');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testProductSearch();
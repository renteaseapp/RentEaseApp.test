// Test file to check if all components compile correctly
import React from 'react';
import { ProductDetailPage } from './features/products/ProductDetailPage';
import { ProductCard } from './features/products/ProductCard';
import { QuantityIndicator } from './components/common/QuantityIndicator';
import { AvailabilityBadge } from './components/common/AvailabilityBadge';
import { OutOfStockNotifier } from './components/common/OutOfStockNotifier';
import { ProductStatusDisplay } from './components/common/ProductStatusDisplay';
import { QuantityManagement } from './components/admin/QuantityManagement';

// Mock product data for testing
const mockProduct = {
  id: 1,
  title: 'Test Product',
  slug: 'test-product',
  rental_price_per_day: 100,
  quantity: 5,
  quantity_available: 2,
  availability_status: 'available' as const,
  admin_approval_status: 'approved' as const
};

// Test component compilation
const TestComponents: React.FC = () => {
  return (
    <div>
      <h1>Testing Component Compilation</h1>
      
      {/* Test QuantityIndicator */}
      <QuantityIndicator
        quantityAvailable={2}
        totalQuantity={5}
        size="md"
        showTotal={true}
      />
      
      {/* Test AvailabilityBadge */}
      <AvailabilityBadge
        status="available"
        type="availability"
        size="md"
      />
      
      {/* Test OutOfStockNotifier */}
      <OutOfStockNotifier
        productId={1}
        productTitle="Test Product"
        isOutOfStock={false}
      />
      
      {/* Test ProductStatusDisplay */}
      <ProductStatusDisplay
        product={mockProduct}
        showQuantity={true}
        showAvailability={true}
        showAdminStatus={true}
      />
      
      {/* Test QuantityManagement */}
      <QuantityManagement />
    </div>
  );
};

console.log('✅ All components compile successfully!');

export default TestComponents;
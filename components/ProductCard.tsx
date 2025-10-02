import React from 'react';
import { Star, MapPin, Calendar, Eye, Heart } from 'lucide-react';
import { ProductMemory } from '../services/aiAgentMemory';

interface ProductCardProps {
  product: ProductMemory;
  onViewDetails?: (productId: string) => void;
  onAddToFavorites?: (productId: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onAddToFavorites,
  compact = false,
  showActions = true
}) => {
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id.toString());
    } else {
      // Default behavior - navigate to product detail page
      window.open(`/products/${product.id}`, '_blank');
    }
  };

  const handleAddToFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToFavorites) {
      onAddToFavorites(product.id.toString());
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  if (compact) {
    return (
      <div 
        className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleViewDetails}
      >
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBMMTAwIDEwMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHRleHQgeD0iMTAwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0QTNCMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
              </svg>
            </div>
          )}
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {product.title}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {product.category}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-blue-600">
              ฿{formatPrice(product.price)}/วัน
            </span>
            <div className="flex items-center">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDIwMCAxNTBMMjAwIDE1MFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk0QTNCMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
          </div>
        )}
        
        {/* Favorite Button */}
        {showActions && (
          <button
            onClick={handleAddToFavorites}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
          </button>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            พร้อมให้เช่า
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Title and Category */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
            {product.title}
          </h3>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {product.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Rating and Location */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {renderStars(product.rating)}
            <span className="ml-2 text-sm text-gray-600">
              ({product.rating})
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="truncate max-w-20">{product.location}</span>
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-blue-600">
              ฿{formatPrice(product.price)}
            </span>
            <span className="text-sm text-gray-500">ต่อวัน</span>
          </div>

          {showActions && (
            <div className="flex space-x-2">
              <button
                onClick={handleViewDetails}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                ดูรายละเอียด
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>อัปเดตล่าสุด: {new Date(product.lastUpdated).toLocaleDateString('th-TH')}</span>
            <span>รหัส: {product.id.toString().slice(-6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Grid Component for multiple products
interface ProductGridProps {
  products: ProductMemory[];
  onViewDetails?: (productId: string) => void;
  onAddToFavorites?: (productId: string) => void;
  compact?: boolean;
  maxItems?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onViewDetails,
  onAddToFavorites,
  compact = false,
  maxItems
}) => {
  const displayProducts = maxItems ? products.slice(0, maxItems) : products;

  if (compact) {
    return (
      <div className="space-y-2">
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetails={onViewDetails}
            onAddToFavorites={onAddToFavorites}
            compact={true}
          />
        ))}
        {maxItems && products.length > maxItems && (
          <div className="text-center py-2">
            <span className="text-sm text-gray-500">
              และอีก {products.length - maxItems} รายการ
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetails={onViewDetails}
          onAddToFavorites={onAddToFavorites}
        />
      ))}
      {maxItems && products.length > maxItems && (
        <div className="col-span-full text-center py-4">
          <span className="text-sm text-gray-500">
            และอีก {products.length - maxItems} รายการ
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
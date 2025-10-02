import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { getProductRentalCount } from '../../services/productService';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const LocationMarkerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block text-gray-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [rentalCount, setRentalCount] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const detailUrl = ROUTE_PATHS.PRODUCT_DETAIL.replace(':slugOrId', product.slug || String(product.id));

  useEffect(() => {
    const fetchRentalCount = async () => {
      try {
        const result = await getProductRentalCount(product.id);
        setRentalCount(result.rental_count);
      } catch (error) {
        console.error('Error fetching rental count:', error);
        setRentalCount(0);
      }
    };

    fetchRentalCount();
  }, [product.id]);

  return (
    <Link 
      to={detailUrl} 
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`h-full flex flex-col overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transform transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:-translate-y-2 ${isHovered ? 'ring-2 ring-blue-200' : ''}`}>
        {/* Image Container with Gradient Overlay */}
        <div className="relative aspect-w-16 aspect-h-9 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {(() => {
            if (product.primary_image?.image_url) return (
              <>
                <img 
                  src={product.primary_image.image_url} 
                  alt={product.title} 
                  className="object-cover w-full h-48 transition-all duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            );
            if (product.images && product.images.length > 0) {
              const primary = product.images.find(img => img.is_primary && !!img.image_url);
              if (primary) return (
                <>
                  <img 
                    src={primary.image_url} 
                    alt={product.title} 
                    className="object-cover w-full h-48 transition-all duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              );
              const first = product.images.find(img => !!img.image_url);
              if (first) return (
                <>
                  <img 
                    src={first.image_url} 
                    alt={product.title} 
                    className="object-cover w-full h-48 transition-all duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              );
            }
            return (
              <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                    📷
                  </div>
                  ไม่มีรูปสินค้า
                </div>
              </div>
            );
          })()}
          
          {/* Status Badge */}
          {product.availability_status && (
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                product.availability_status === 'available' 
                  ? 'bg-green-500/90 text-white shadow-lg' 
                  : product.availability_status === 'rented_out'
                  ? 'bg-orange-500/90 text-white shadow-lg'
                  : 'bg-red-500/90 text-white shadow-lg'
              }`}>
                {product.availability_status === 'available' ? '✓ พร้อมเช่า' 
                 : product.availability_status === 'rented_out' ? '⏰ เช่าหมด'
                 : '✗ ไม่พร้อม'}
              </span>
            </div>
          )}

          {/* Rental Count Badge */}
          {rentalCount !== null && rentalCount > 0 && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/90 text-white backdrop-blur-sm shadow-lg">
                🔥 {rentalCount}
              </span>
            </div>
          )}
        </div>

        <CardContent className="flex-grow flex flex-col justify-between p-5 bg-gradient-to-b from-white to-gray-50/50">
          <div className="space-y-3">
            {/* Title and Category */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 leading-tight" title={product.title}>
                {product.title}
              </h3>
              {product.category && (
                <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">
                  {product.category.name}
                </p>
              )}
            </div>

            {/* Location */}
            {product.province && (
              <div className="flex items-center text-sm text-gray-600">
                <LocationMarkerIcon />
                <span className="font-medium">{product.province.name_th}</span>
              </div>
            )}

            {/* Quantity Available */}
            {product.quantity_available !== undefined && (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                  product.quantity_available > 0 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  📦 มี {product.quantity_available} ชิ้น
                </span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ฿{product.rental_price_per_day.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 font-medium">ต่อวัน</p>
              </div>
              
              {/* Rating Stars (Mock) */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} />
                ))}
                <span className="text-xs text-gray-500 ml-1">(4.8)</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-3">
              <div className={`w-full py-2 px-4 rounded-lg text-center text-sm font-semibold transition-all duration-300 ${
                product.availability_status === 'available'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md group-hover:shadow-lg group-hover:from-blue-600 group-hover:to-purple-600'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}>
                {product.availability_status === 'available' ? 'เช่าเลย' : 'ไม่พร้อมให้เช่า'}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Hover Effect Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-pink-400/0 group-hover:from-blue-400/10 group-hover:via-purple-400/10 group-hover:to-pink-400/10 transition-all duration-500 pointer-events-none" />
      </Card>
    </Link>
  );
};

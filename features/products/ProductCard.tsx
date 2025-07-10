import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
}

const LocationMarkerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block text-gray-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useTranslation();
  const detailUrl = ROUTE_PATHS.PRODUCT_DETAIL.replace(':slugOrId', product.slug || String(product.id));

  return (
    <Link to={detailUrl} className="block group">
      <Card className="h-full flex flex-col transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
        <div className="aspect-w-16 aspect-h-9 overflow-hidden">
          {(() => {
            if (product.primary_image?.image_url) return (
              <img src={product.primary_image.image_url} alt={product.title} className="object-cover w-full h-48 group-hover:opacity-90 transition-opacity" />
            );
            if (product.images && product.images.length > 0) {
              // หา is_primary
              const primary = product.images.find(img => img.is_primary && !!img.image_url);
              if (primary) return (
                <img src={primary.image_url} alt={product.title} className="object-cover w-full h-48 group-hover:opacity-90 transition-opacity" />
              );
              // ถ้าไม่มี is_primary ให้ใช้รูปแรกที่มี image_url
              const first = product.images.find(img => !!img.image_url);
              if (first) return (
                <img src={first.image_url} alt={product.title} className="object-cover w-full h-48 group-hover:opacity-90 transition-opacity" />
              );
            }
            // ไม่มีรูปเลย
            return (
              <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
                ไม่มีรูปสินค้า
              </div>
            );
          })()}
        </div>
        <CardContent className="flex-grow flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate" title={product.title}>
              {product.title}
            </h3>
            {product.category && (
                <p className="text-xs text-gray-500 mt-1">{product.category.name}</p>
            )}
          </div>
          <div className="mt-3">
            {product.province && (
              <p className="text-sm text-gray-600 flex items-center">
                <LocationMarkerIcon />
                {product.province.name_th}
              </p>
            )}
            <p className="text-xl font-bold text-blue-600 mt-2">
              ฿{product.rental_price_per_day.toLocaleString()} <span className="text-sm font-normal text-gray-500">{t('productCard.pricePerDay')}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

import { Product, Category, Province, ApiError, ProductAdminApprovalStatus, ProductAvailabilityStatus, ProductSearchParams, PaginatedResponse } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const getFeaturedProducts = async (limit: number = 8): Promise<{ data: Product[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch featured products');
    }
    const responseData = await response.json();
    // Ensure we're working with an array
    const products = Array.isArray(responseData.data) ? responseData.data : 
                    Array.isArray(responseData.data?.data) ? responseData.data.data : [];
    return { data: products };
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

export const getFeaturedCategories = async (limit: number = 6): Promise<{ data: Category[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories?featured=true&limit=${limit}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch categories');
    }
    const responseData = await response.json();
    const categories = responseData.data || [];
    return { data: Array.isArray(categories) ? categories.slice(0, limit) : [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getProductByID = async (slugOrId: string | number): Promise<{ data: Product }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${slugOrId}`);
    if (!response.ok) {
      throw new Error('Product not found');
    }
    const result = await response.json();
    if (result.data && result.data.data) {
      return { data: result.data.data };
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

export const getProvinces = async (): Promise<{data: Province[]}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/provinces`);
    if (!response.ok) {
      throw new Error('Failed to fetch provinces');
    }
    const data = await response.json();
    return { data: data.data.data || [] };
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<{data: Category[]}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return { data: data.data.data || [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: [] };
  }
};

export const searchProducts = async (params: ProductSearchParams): Promise<PaginatedResponse<Product>> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params.q) queryParams.append('q', params.q);
    if (params.min_price) queryParams.append('min_price', params.min_price.toString());
    if (params.max_price) queryParams.append('max_price', params.max_price.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.province_ids) queryParams.append('province_ids', params.province_ids);

    const response = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to search products');
    }
    
    const responseData = await response.json();
    
    // Ensure the response has the expected structure
    if (!responseData.data || !Array.isArray(responseData.data)) {
      throw new Error('Invalid response format from server');
    }

    return {
      data: responseData.data,
      meta: {
        current_page: responseData.meta?.current_page || 1,
        last_page: responseData.meta?.last_page || 1,
        per_page: responseData.meta?.per_page || 10,
        total: responseData.meta?.total || 0,
        from: responseData.meta?.from || 1,
        to: responseData.meta?.to || 0
      },
      links: responseData.links || {
        first: null,
        last: null,
        prev: null,
        next: null
      }
    };
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

import { Rental, CreateRentalPayload, PaymentProofPayload, ReviewPayload, ApiError, PaginatedResponse, RentalStatus, PaymentStatus, Review, RentalPickupMethod, RentalReturnConditionStatus, ApiResponse, InitiateReturnPayload } from '../types';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createRentalRequest = async (payload: CreateRentalPayload): Promise<Rental> => {
  try {
    const response = await api.post(`/rentals`, payload);
    return response.data.data.data;
  } catch (error) {
    console.error('Error creating rental request:', error);
    throw error;
  }
};

export const getRentalDetails = async (rentalIdOrUid: number | string, userId: number, userRole: 'renter' | 'owner' | 'admin'): Promise<Rental> => {
  try {
    const response = await api.get(`/rentals/${rentalIdOrUid}`, {
      params: { user_id: userId, user_role: userRole }
    });
    return response.data.data.data;
  } catch (error) {
    console.error('Error fetching rental details:', error);
    throw error;
  }
};

export const getRentalsForUser = async (userId: number, role: 'renter' | 'owner', params: { status?: string, page?: number, limit?: number }): Promise<PaginatedResponse<Rental>> => {
  try {
    const response = await api.get(`/rentals`, {
      params: {
        user_id: userId,
        role,
        ...params
      }
    });
    return {
      data: response.data.data,
      meta: {
        current_page: response.data.pagination.page,
        last_page: response.data.pagination.total_pages,
        per_page: response.data.pagination.limit,
        total: response.data.pagination.total,
        from: (response.data.pagination.page - 1) * response.data.pagination.limit + 1,
        to: Math.min(response.data.pagination.page * response.data.pagination.limit, response.data.pagination.total)
      }
    };
  } catch (error) {
    console.error('Error fetching rentals for user:', error);
    throw error;
  }
};

export const getOwnerRentals = async (params: { 
  status?: string, 
  q?: string, 
  date_from?: string, 
  date_to?: string, 
  page?: number, 
  limit?: number 
}): Promise<PaginatedResponse<Rental>> => {
  try {
    const response = await api.get('/owners/me/rentals', { params });
    
    // Transform the response to match our PaginatedResponse interface
    return {
      data: response.data.data.data || [],
      meta: {
        current_page: response.data.data.pagination.page,
        last_page: response.data.data.pagination.totalPages,
        per_page: response.data.data.pagination.limit,
        total: response.data.data.pagination.total,
        from: (response.data.data.pagination.page - 1) * response.data.data.pagination.limit + 1,
        to: Math.min(response.data.data.pagination.page * response.data.data.pagination.limit, response.data.data.pagination.total)
      }
    };
  } catch (error) {
    console.error('Error fetching owner rentals:', error);
    throw error;
  }
};

export const getRentalByIdOrUid = async (rentalIdOrUid: string | number): Promise<Rental> => {
  try {
    const response = await api.get(`/rentals/${rentalIdOrUid}`);
    return response.data.data.data;
  } catch (error) {
    console.error('Error fetching rental details:', error);
    throw error;
  }
};

export const approveRentalRequest = async (rentalIdOrUid: string | number): Promise<Rental> => {
  try {
    const response = await api.put(`/rentals/${rentalIdOrUid}/approve`);
    return response.data.data.data;
  } catch (error) {
    console.error('Error approving rental request:', error);
    throw error;
  }
};

export const rejectRentalRequest = async (rentalIdOrUid: string | number, reason: string): Promise<Rental> => {
  try {
    const response = await api.put(`/rentals/${rentalIdOrUid}/reject`, { reason });
    return response.data.data.data;
  } catch (error) {
    console.error('Error rejecting rental request:', error);
    throw error;
  }
};

export const submitPaymentProof = async (
  rentalId: number | string,
  payload: { payment_proof_image: File; transaction_time?: string; amount_paid?: number }
): Promise<Rental> => {
  const formData = new FormData();
  formData.append('payment_proof_image', payload.payment_proof_image);
  if (payload.transaction_time) formData.append('transaction_time', payload.transaction_time);
  if (payload.amount_paid) formData.append('amount_paid', String(payload.amount_paid));

  const response = await api.put(`/rentals/${rentalId}/payment-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-Type' }
  });
  return response.data.data.data;
};

export const submitReview = async (payload: ReviewPayload, renterId: number): Promise<Review> => {
  try {
    const response = await api.post(`/rentals/${payload.rental_id}/review`, {
      ...payload,
      renter_id: renterId
    });
    return response.data.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

export const getProductReviews = async (productId: number, params: {page?:number, limit?:number} = {}): Promise<PaginatedResponse<Review>> => {
  try {
    const response = await api.get(`/products/${productId}/reviews`, { params });
    return {
      data: response.data.data.data,
      meta: {
        current_page: response.data.data.meta.current_page,
        last_page: response.data.data.meta.last_page,
        per_page: response.data.data.meta.per_page,
        total: response.data.data.meta.total,
        from: 1,
        to: response.data.data.data.length
      }
    };
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    throw error;
  }
};

export const reportReturnByOwner = async (rentalId: number, ownerId: number, payload: { actual_return_time: string; return_condition_status: string; notes_from_owner_on_return?: string; initiate_claim?: boolean }): Promise<Rental> => {
  try {
    const response = await api.post(`/rentals/${rentalId}/report-return`, {
      owner_id: ownerId,
      ...payload
    });
    return response.data.data;
  } catch (error) {
    console.error('Error reporting return:', error);
    throw error;
  }
};

export const markPaymentSlipInvalid = async (rentalIdOrUid: string | number): Promise<any> => {
  try {
    const response = await api.post(`/rentals/${rentalIdOrUid}/mark-slip-invalid`);
    return response.data;
  } catch (error) {
    console.error('Error marking payment slip as invalid:', error);
    throw error;
  }
};

export const getMyRentals = async (params: { status?: string, q?: string, page?: number, limit?: number } = {}): Promise<PaginatedResponse<Rental>> => {
  try {
    const response = await api.get('/renters/me/rentals', { params });
    return {
      data: response.data.data.data,
      meta: {
        current_page: response.data.data.pagination.page,
        last_page: response.data.data.pagination.totalPages,
        per_page: response.data.data.pagination.limit,
        total: response.data.data.pagination.total,
        from: (response.data.data.pagination.page - 1) * response.data.data.pagination.limit + 1,
        to: Math.min(response.data.data.pagination.page * response.data.data.pagination.limit, response.data.data.pagination.total)
      }
    };
  } catch (error) {
    console.error('Error fetching my rentals:', error);
    throw error;
  }
};

export const cancelRental = async (rentalId: number | string, reason: string): Promise<Rental> => {
  if (!reason || reason.trim() === '') throw new Error('Cancellation reason is required');
  try {
    const response = await api.put(`/rentals/${rentalId}/cancel`, { reason });
    return response.data.data.data;
  } catch (error) {
    console.error('Error cancelling rental:', error);
    throw error;
  }
};

export interface ProcessReturnPayload {
    actual_return_time: string;
    return_condition_status: RentalReturnConditionStatus;
    notes_from_owner_on_return?: string;
    initiate_claim?: boolean;
    "return_condition_images[]"?: File[];
}

export const processReturn = async (rentalIdOrUid: number | string, payload: ProcessReturnPayload): Promise<ApiResponse<Rental>> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw { message: 'No authentication token found', status: 401 } as ApiError;
    }

    const formData = new FormData();
    formData.append('actual_return_time', payload.actual_return_time);
    formData.append('return_condition_status', payload.return_condition_status);
    
    if (payload.notes_from_owner_on_return) {
        formData.append('notes_from_owner_on_return', payload.notes_from_owner_on_return);
    }
    if (payload.initiate_claim !== undefined) {
        formData.append('initiate_claim', String(payload.initiate_claim));
    }

    if (payload["return_condition_images[]"]) {
        payload["return_condition_images[]"].forEach(file => {
            formData.append('return_condition_images[]', file);
        });
    }

    try {
        const response = await fetch(`${API_URL}/rentals/${rentalIdOrUid}/return`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw { message: result.message || 'Failed to process return', status: response.status, errors: result.errors } as ApiError;
        }

        return result as ApiResponse<Rental>;

    } catch (error) {
        console.error('Error processing return:', error);
        if (error instanceof Object && 'status' in error) {
            throw error;
        }
        throw { message: 'An unexpected error occurred while processing the return.', status: 500 } as ApiError;
    }
};

export const initiateReturn = async (rentalId: number | string, payload: InitiateReturnPayload): Promise<Rental> => {
  const formData = new FormData();

  formData.append('return_method', payload.return_method);
  
  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  if (payload.return_method === 'shipping' && payload.return_details) {
    formData.append('return_details[carrier]', payload.return_details.carrier || '');
    if (payload.return_details.tracking_number) {
      formData.append('return_details[tracking_number]', payload.return_details.tracking_number);
    }
    if (payload.return_details.return_datetime) {
      formData.append('return_details[return_datetime]', payload.return_details.return_datetime);
    }
  }

  if (payload.return_method === 'in_person' && payload.return_details) {
    formData.append('return_details[return_datetime]', payload.return_details.return_datetime);
    formData.append('return_details[location]', payload.return_details.location || '');
  }

  if (payload.shipping_receipt_image) {
    formData.append('shipping_receipt_image', payload.shipping_receipt_image);
  }

  try {
    const response = await api.post(`/rentals/${rentalId}/initiate-return`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.data;
  } catch (error) {
    console.error('Error initiating return:', error);
    throw error;
  }
};

export const getRentalReturnInfo = async (rentalIdOrUid: number | string) => {
  const response = await api.get(`/rentals/${rentalIdOrUid}/return`);
  return response.data.data.data;
};

export const verifyKbankSlip = async ({
  token,
  rqUID,
  rqDt,
  sendingBank,
  transRef
}: {
  token: string;
  rqUID: string;
  rqDt: string;
  sendingBank: string;
  transRef: string;
}) => {
  const url = 'https://openapi-sandbox.kasikornbank.com/v1/verslip/kbank/verify';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const body = {
    rqUID,
    rqDt,
    data: {
      sendingBank,
      transRef
    }
  };
  const response = await axios.post(url, body, { headers });
  return response.data;
};

export const verifySlipByImage = async ({
  file,
  token
}: {
  file: File;
  token: string;
}) => {
  const url = 'https://developer.easyslip.com/api/v1/verify';
  const formData = new FormData();
  formData.append('file', file);
  const headers = {
    'Authorization': `Bearer ${token}`
    // 'Content-Type' ไม่ต้องใส่ axios จะจัดการ multipart ให้เอง
  };
  const response = await axios.post(url, formData, { headers });
  return response.data;
};

export const verifyRentalPayment = async (rentalIdOrUid: string | number, amount_paid?: number): Promise<Rental> => {
  try {
    const payload = amount_paid !== undefined ? { amount_paid } : undefined;
    const response = await api.put(`/rentals/${rentalIdOrUid}/verify-payment`, payload);
    return response.data.data.data;
  } catch (error) {
    console.error('Error verifying rental payment:', error);
    throw error;
  }
};

export const setActualPickupTime = async (rentalIdOrUid: string | number, actual_pickup_time: string): Promise<Rental> => {
  try {
    const response = await api.put(`/rentals/${rentalIdOrUid}/actual-pickup`, { actual_pickup_time });
    return response.data.data;
  } catch (error) {
    console.error('Error setting actual pickup time:', error);
    throw error;
  }
};

export const createReview = async ({ rental_id, rating_product, rating_owner, comment }: { rental_id: number, rating_product: number, rating_owner: number, comment: string }) => {
  try {
    const response = await api.post('/reviews', { rental_id, rating_product, rating_owner, comment });
    return response.data.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getReview = async (rentalId: number) => {
  try {
    const response = await api.get(`/reviews/${rentalId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting review:', error);
    throw error;
  }
};

export const updateReview = async (rentalId: number, { rating_product, rating_owner, comment }: { rating_product?: number, rating_owner?: number, comment?: string }) => {
  try {
    const response = await api.put(`/reviews/${rentalId}`, { rating_product, rating_owner, comment });
    return response.data.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

export const deleteReview = async (rentalId: number) => {
  try {
    const response = await api.delete(`/reviews/${rentalId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const completeRentalDirectly = async (rentalIdOrUid: string | number): Promise<Rental> => {
  try {
    const response = await api.put(`/rentals/${rentalIdOrUid}/complete`);
    return response.data.data.data;
  } catch (error) {
    console.error('Error completing rental directly:', error);
    throw error;
  }
};
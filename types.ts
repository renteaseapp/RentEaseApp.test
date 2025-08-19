export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  profile_picture_url: string | null;
  email_verified_at: string | null; // ISO Date string
  last_login_at?: string | null; // ISO Date string
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province_id?: number | null;
  postal_code?: string | null;
  id_verification_status?: UserIdVerificationStatus;
  id_document_type?: UserIdDocumentType | null;
  id_document_number?: string | null;
  id_verified_at?: string | null; // ISO Date string
  id_verification_notes?: string | null;
  id_document_url?: string | null;
  id_document_back_url?: string | null;
  id_selfie_url?: string | null;
  is_active?: boolean;
  preferences?: Record<string, any>; // JSONB
  created_at?: string; // ISO Date string
  updated_at?: string; // ISO Date string
}

export interface Province {
  id: number;
  name_th: string;
  name_en?: string;
  region_id?: number;
}

export interface UserAddress {
  id: number;
  user_id: number;
  address_type: 'billing' | 'shipping' | 'other'; // Example enum values
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string | null;
  sub_district?: string | null;
  district: string;
  province_id: number;
  province_name?: string; // Joined
  postal_code: string;
  is_default?: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfileData {
  user: User & {
    province?: Province | null;
    addresses?: UserAddress[];
  };
}

export interface UserIdVerificationData {
  status: UserIdVerificationStatus;
  notes: string | null;
  document_type: UserIdDocumentType | null;
  document_number: string | null;
  verified_at: string | null; // ISO Date string
  document_urls: {
    front: string | null;
    back: string | null;
    selfie: string | null;
  };
}

export interface IdVerificationSubmissionPayload {
  id_document_type: UserIdDocumentType;
  id_document_number?: string;
  id_document_front: File;
  id_document_back?: File;
  id_selfie?: File;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  is_admin: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RegisterResponse {
  user: User;
  access_token: string;
  message: string;
}

export interface ForgotPasswordResponse {
  statusCode: number;
  data: {
    message: string;
  };
  message: string;
  success: boolean;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ResetPasswordResponse {
  statusCode: number;
  data: {
    message: string;
  };
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>; // For validation errors
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  isLoading: boolean;
  login: (token: string, userData: User, isAdminFlag: boolean) => void;
  logout: () => void;
  updateUserContext: (updatedUserData: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
}

export interface Category {
  id: number;
  name: string;
  name_en?: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  image_url?: string | null;
  sort_order?: number;
  parent_id?: number | null;
  is_featured?: boolean;
  is_active?: boolean;
}

export interface ProductImage {
  id?: number;
  image_url: string;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductOwner {
  id: number;
  first_name: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
  created_at?: string; // User creation date
  average_owner_rating?: number | null;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  rental_price_per_day: number; // Or string if using decimal types from DB
  province?: Province; // Simplified from province_id for display
  primary_image?: ProductImage; // Simplified from product_images for display
  category?: Category; // Simplified from category_id
  description?: string;
  images?: ProductImage[];
  owner?: ProductOwner;
  average_rating?: number | null;
  total_reviews?: number;
  owner_id?: number;
  category_id?: number;
  province_id?: number;
  specifications?: Record<string, any>; // JSONB
  rental_price_per_week?: number | null;
  rental_price_per_month?: number | null;
  security_deposit?: number;
  quantity?: number;
  quantity_available?: number;
  min_rental_duration_days?: number;
  max_rental_duration_days?: number | null;
  address_details?: string;
  latitude?: number | null;
  longitude?: number | null;
  condition_notes?: string;
  view_count?: number;
  availability_status?: ProductAvailabilityStatus;
  admin_approval_status?: ProductAdminApprovalStatus;
  is_featured?: boolean;
  deleted_at?: string | null; // ISO Date string
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}

export enum ProductAvailabilityStatus {
  AVAILABLE = 'available',
  RENTED_OUT = 'rented_out',
  UNAVAILABLE = 'unavailable',
  PENDING_APPROVAL = 'pending_approval', 
  DRAFT = 'draft',
}

export enum ProductAdminApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum UserIdVerificationStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum UserIdDocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  OTHER = 'other',
}

export interface ProductSearchParams {
  q?: string;
  category_id?: number;
  province_ids?: string; // comma-separated
  min_price?: number;
  max_price?: number;
  sort?: string; // e.g., 'price_asc', 'price_desc', 'newest'
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

// Owner Specific Types
export interface OwnerDashboardData {
  total_my_products: number;
  active_rentals_count: number;
  estimated_monthly_revenue: number;
  pending_rental_requests_count: number;
}

export interface PayoutMethod {
  id: number;
  owner_id: number;
  method_type: 'bank_account' | 'promptpay';
  account_name: string;
  account_number: string;
  bank_name?: string | null;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

// Rental Specific Types
export interface Rental {
  id: number;
  rental_uid: string; // UUID
  renter_id: number;
  product_id: number;
  owner_id: number;
  start_date: string; // ISO Date string
  end_date: string; // ISO Date string
  actual_pickup_time?: string | null; // ISO Date string
  actual_return_time?: string | null;
  rental_price_per_day_at_booking: number;
  security_deposit_at_booking?: number;
  security_deposit_refund_amount?: number; // Added this field
  calculated_subtotal_rental_fee: number;
  delivery_fee?: number;
  platform_fee_renter?: number;
  platform_fee_owner?: number;
  late_fee_calculated?: number;
  total_amount_due: number;
  final_amount_paid?: number;
  pickup_method: RentalPickupMethod;
  return_method?: RentalPickupMethod; // Can be same as pickup or different
  delivery_address_id?: number | null;
  delivery_address?: UserAddress; // Joined
  rental_status: RentalStatus;
  payment_status: PaymentStatus;
  notes_from_renter?: string | null;
  notes_from_owner_on_return?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by_user_id?: number | null;
  payment_proof_url?: string | null;
  return_condition_status?: RentalReturnConditionStatus;
  return_condition_image_urls?: string[];
  payment_verified_at?: string | null;
  payment_verification_notes?: string | null;
  // Return tracking
  return_initiated_at?: string | null;
  return_details?: string | Record<string, any>;
  return_shipping_receipt_url?: string | null;
  // --- เพิ่มฟิลด์สำหรับ delivery status ---
  delivery_status?: 'pending' | 'shipped' | 'delivered' | 'failed' | 'returned';
  tracking_number?: string | null;
  carrier_code?: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
  // Joined data typically
  product?: Partial<Product>;
  renter?: Partial<User>;
  owner?: Partial<User>;
  review_by_renter?: Partial<Review>;
  review_by_owner?: Partial<Review>;
}

export enum RentalPickupMethod {
  SELF_PICKUP = 'self_pickup',
  DELIVERY = 'delivery',
}

export enum RentalStatus {
  DRAFT = 'draft', // Renter started but not submitted
  PENDING_OWNER_APPROVAL = 'pending_owner_approval',
  PENDING_PAYMENT = 'pending_payment', // Owner approved, renter needs to pay
  CONFIRMED = 'confirmed', // Payment received (or COD confirmed)
  ACTIVE = 'active', // Item picked up / delivered
  COMPLETED = 'completed', // Item returned and all clear
  CANCELLED_BY_RENTER = 'cancelled_by_renter',
  CANCELLED_BY_OWNER = 'cancelled_by_owner',
  REJECTED_BY_OWNER = 'rejected_by_owner',
  DISPUTE = 'dispute', // Claim initiated
  LATE_RETURN = 'late_return',
  PENDING_VERIFICATION = 'pending_verification', // Payment proof uploaded, admin/owner to verify
  RETURN_PENDING = 'return_pending', // Renter indicated return, owner to confirm receipt
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending', // Payment initiated with gateway
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  PENDING_VERIFICATION = 'pending_verification', // Manual proof uploaded
}

export enum RentalReturnConditionStatus {
  AS_RENTED = 'as_rented', // สภาพเหมือนเดิมตอนให้เช่า
  MINOR_WEAR = 'minor_wear', // มีร่องรอยการใช้งานเล็กน้อย
  DAMAGED = 'damaged', // สินค้ามีความเสียหาย
  LOST = 'lost' // สินค้าสูญหาย
}

export interface CreateRentalPayload {
  product_id: number;
  start_date: string;
  end_date: string;
  pickup_method: RentalPickupMethod;
  delivery_address_id?: number;
  new_delivery_address?: Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'province_name'>;
  notes_from_renter?: string;
}

export interface InitiateReturnPayload {
  return_method: 'shipping' | 'in_person';
  return_details: {
    // shipping
    carrier?: string;
    tracking_number?: string;
    // in_person
    return_datetime: string;
    location?: string;
  };
  notes?: string;
  shipping_receipt_image?: File;
}

export interface PaymentProofPayload {
  payment_proof_image: File;
  transaction_time?: string; // ISO Date String
  amount_paid?: number;
}

export interface ReviewPayload {
  rental_id: number;
  rating_product: number; // 1-5
  rating_owner: number; // 1-5
  comment?: string;
}

export interface Review {
    id: number;
    rental_id: number;
    renter_id: number;
    product_id: number;
    owner_id: number;
    rating_product: number;
    rating_owner: number;
    comment?: string | null;
    is_hidden_by_admin?: boolean;
    created_at: string;
    renter?: Pick<User, 'id' | 'first_name' | 'profile_picture_url'>;
}


// Renter Specific Types
export interface RenterDashboardData {
  current_active_rentals: { data: Partial<Rental>[]; total: number };
  confirmed_rentals: { data: Partial<Rental>[]; total: number };
  pending_action_rentals: { data: Partial<Rental>[]; total: number };
  pending_approval_rentals: { data: Partial<Rental>[]; total: number };
  completed_rentals: { data: Partial<Rental>[]; total: number };
  cancelled_rentals: { data: Partial<Rental>[]; total: number };
  late_return_rentals: { data: Partial<Rental>[]; total: number };
  // Optionally, keep these if still used elsewhere:
  // recent_rental_history_summary?: Partial<Rental>[];
  // wishlist_summary?: Partial<Product>[];
  // recent_notifications?: AppNotification[];
}

// General App Types
export interface AppNotification {
  id: string; // or number
  user_id: number;
  type: string; // e.g., 'new_message', 'rental_request', 'payment_confirmed'
  title: string;
  message: string;
  link_url?: string;
  related_entity_type?: string; // 'product', 'rental', 'user'
  related_entity_id?: number | string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

// Static Content Types
export interface StaticPageContent {
  slug: string;
  title: string;
  title_en?: string;
  content_html: string;
  content_html_en?: string;
  meta_title?: string;
  meta_description?: string;
  updated_at: string;
  is_published?: boolean;
}

export interface FaqItem {
  id: number;
  faq_category_id: number;
  question: string;
  question_en?: string;
  answer: string;
  answer_en?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface FaqCategory {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  faqs?: FaqItem[];
}



// AI Chat Types
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIChatResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Chat Types
export interface ChatConversation {
    id: string | number; // or number
    conversation_uid?: string;
    participant1_id: number;
    participant2_id: number;
    related_product_id?: number | null;
    related_rental_id?: number | null;
    last_message_id?: string | number | null;
    last_message_at?: string | null; // ISO string
    p1_unread_count?: number;
    p2_unread_count?: number;
    // Joined data for display
    other_user?: Pick<User, 'id' | 'first_name' | 'last_name' | 'profile_picture_url'>;
    last_message_content?: string;
    related_product_title?: string;
    unread_count?: number; // specific to current user
    // --- เพิ่มเติมตาม API ใหม่ ---
    last_message?: {
        sent_at: string;
        sender_id: number;
        message_type: string;
        message_content: string;
    };
    related_product?: {
        id: number;
        slug: string;
        title: string;
    };
}

export interface ChatMessage {
    id: string; // or number
    message_uid?: string;
    conversation_id: string; // or number
    sender_id: number;
    message_type: 'text' | 'image' | 'file' | 'rental_inquiry'; // enum
    message_content: string; // For text, or stringified JSON for complex types
    attachment_url?: string | null;
    attachment_metadata?: Record<string, any> | null; // e.g. filename, size for files
    sent_at: string; // ISO string
    read_at?: string | null; // ISO string
}

export interface IdVerificationResponse {
  success: boolean;
  message?: string;
  data: {
    status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    status_th: string; // Thai translation of status
    notes: string | null;
    document_type: 'national_id' | 'passport' | 'other';
    document_type_th: string; // Thai translation of document type
    document_number: string;
    document_url: string;
    document_back_url: string | null;
    selfie_url: string | null;
  }
}

export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token', // Token will be part of the path

  // User specific
  PROFILE: '/profile',
  ID_VERIFICATION: '/profile/id-verification',
  USER_ADDRESSES: '/profile/addresses', // Placeholder if separate page is desired
  MY_RENTALS_RENTER: '/my-rentals', // Renter's view of their rentals
  SUBMIT_REVIEW: '/review/:rentalId', // For renter to submit review

  // Product specific
  PRODUCT_DETAIL: '/products/:slugOrId',
  SEARCH_PRODUCTS: '/search',

  // Owner specific
  OWNER_DASHBOARD: '/owner/dashboard',
  MY_LISTINGS: '/owner/listings',
  MY_LISTINGS_OWNER: '/owner/listings', // Alias for MY_LISTINGS
  CREATE_PRODUCT: '/owner/listings/new',
  EDIT_PRODUCT: '/owner/listings/edit/:productId',
  OWNER_RENTAL_HISTORY: '/owner/rentals',
  OWNER_RENTAL_DETAIL: '/owner/rentals/:rentalId',
  PAYOUT_INFO: '/owner/payout-info',
  OWNER_REPORT_RETURN: '/owner/returns/:rentalId/report',
  OWNER_REPORT: '/owner/report',

  // Renter specific paths
  RENTER_DASHBOARD: '/renter/dashboard', 
  RENTAL_CHECKOUT_PAGE: '/checkout/:productId', 
  PAYMENT_PAGE: '/payment/:rentalId', 
  RENTER_RENTAL_DETAIL: '/renter/rentals/:rentalId', 
  WISHLIST: '/my/wishlist',
  USER_COMPLAINTS: '/my/complaints',

  // Chat
  CHAT_INBOX: '/chat',
  CHAT_ROOM: '/chat/:conversationId',



  // Admin specific
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_MANAGE_USERS: '/admin/users',
  ADMIN_USER_DETAIL: '/admin/users/:userId',
  ADMIN_MANAGE_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_DETAIL: '/admin/products/:productId', // Admin view of product detail
  ADMIN_MANAGE_RENTALS: '/admin/rentals',
  ADMIN_RENTAL_DETAIL: '/admin/rentals/:rentalId', // Admin view of rental detail
  ADMIN_MANAGE_CATEGORIES: '/admin/categories',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_LOGS: '/admin/logs',

  ADMIN_SETTINGS: '/admin/settings',

  // Static Pages
  ABOUT_US: '/about',
  FAQ: '/faq',
  TERMS_OF_SERVICE: '/terms',
  PRIVACY_POLICY: '/privacy',
} as const;

export const API_BASE_URL = 'https://renteaseapi-test.onrender.com/api'; // Updated to use the actual API server
export const MOCK_USER_ID = 1; // For services that need a logged-in user context
export const MOCK_ADMIN_USER_ID = 99; // For admin actions in mocks

export const THAI_BANKS = [
  { code: 'BBL', name: 'ธนาคารกรุงเทพ', nameEn: 'Bangkok Bank' },
  { code: 'KBANK', name: 'ธนาคารกสิกรไทย', nameEn: 'Kasikorn Bank' },
  { code: 'SCB', name: 'ธนาคารไทยพาณิชย์', nameEn: 'Siam Commercial Bank' },
  { code: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา', nameEn: 'Bank of Ayudhya' },
  { code: 'TMB', name: 'ธนาคารทหารไทยธนชาต', nameEn: 'TMBThanachart Bank' },
  { code: 'KTB', name: 'ธนาคารกรุงไทย', nameEn: 'Krung Thai Bank' },
  { code: 'TTB', name: 'ธนาคารทีเอ็มบีธนชาต', nameEn: 'TTB Bank' },
  { code: 'CIMB', name: 'ธนาคารซีไอเอ็มบี ไทย', nameEn: 'CIMB Thai Bank' },
  { code: 'UOB', name: 'ธนาคารยูโอบี', nameEn: 'United Overseas Bank' },
  { code: 'GSB', name: 'ธนาคารออมสิน', nameEn: 'Government Savings Bank' },
  { code: 'BAAC', name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', nameEn: 'Bank for Agriculture and Agricultural Cooperatives' },
  { code: 'GHB', name: 'ธนาคารอาคารสงเคราะห์', nameEn: 'Government Housing Bank' },
  { code: 'EXIM', name: 'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย', nameEn: 'Export-Import Bank of Thailand' },
  { code: 'ICBC', name: 'ธนาคารไอซีบีซี (ไทย)', nameEn: 'Industrial and Commercial Bank of China (Thai)' },
  { code: 'BOC', name: 'ธนาคารแห่งประเทศจีน (ไทย)', nameEn: 'Bank of China (Thai)' },
  { code: 'CCB', name: 'ธนาคารก่อสร้างแห่งประเทศจีน (ไทย)', nameEn: 'China Construction Bank (Thai)' },
  { code: 'MUFG', name: 'ธนาคารมิซูโฮ', nameEn: 'Mizuho Bank' },
  { code: 'SMBC', name: 'ธนาคารซูมิโตโม มิตซุย แบงกิ้ง คอร์ปอเรชั่น', nameEn: 'Sumitomo Mitsui Banking Corporation' },
  { code: 'BNP', name: 'ธนาคารบีเอ็นพี พาริบาส', nameEn: 'BNP Paribas' },
  { code: 'CITI', name: 'ธนาคารซิตี้แบงก์', nameEn: 'Citibank' },
  { code: 'HSBC', name: 'ธนาคารเอชเอสบีซี', nameEn: 'HSBC Bank' },
  { code: 'DB', name: 'ธนาคารดอยท์เช บังก์', nameEn: 'Deutsche Bank' },
  { code: 'JPM', name: 'ธนาคารเจพีมอร์แกน เชส', nameEn: 'JPMorgan Chase Bank' },
  { code: 'SC', name: 'ธนาคารสแตนดาร์ดชาร์เตอร์ด', nameEn: 'Standard Chartered Bank' },
  { code: 'RHB', name: 'ธนาคารอาร์เอชบี', nameEn: 'RHB Bank' },
  { code: 'MAYBANK', name: 'ธนาคารเมย์แบงก์', nameEn: 'Maybank' },
  { code: 'OCBC', name: 'ธนาคารโอซีบีซี', nameEn: 'OCBC Bank' },
  { code: 'DBS', name: 'ธนาคารดีบีเอส', nameEn: 'DBS Bank' }
] as const;

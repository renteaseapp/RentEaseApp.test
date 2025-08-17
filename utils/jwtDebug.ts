// JWT Token debugging utility

export const debugJWTToken = (token: string) => {
  try {
    // Decode JWT token (without verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    
    console.log('🔍 JWT Token Debug Info:');
    console.log('📋 Token Structure:', {
      header: JSON.parse(atob(token.split('.')[0])),
      payload: payload,
      signature: token.split('.')[2].substring(0, 20) + '...'
    });
    
    console.log('👤 User Info:', {
      id: payload.id,
      email: payload.email,
      first_name: payload.first_name,
      is_admin: payload.is_admin,
      role: payload.role
    });
    
    console.log('⏰ Token Expiry:', {
      issuedAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      isExpired: Date.now() > payload.exp * 1000
    });
    
    return {
      isValid: true,
      payload,
      isExpired: Date.now() > payload.exp * 1000
    };
    
  } catch (error) {
    console.error('❌ JWT Token Debug Failed:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

export const checkAuthStatus = () => {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  const isAdmin = localStorage.getItem('isAdmin');
  
  console.log('🔐 Auth Status Check:');
  console.log('Token exists:', !!token);
  console.log('User data exists:', !!userData);
  console.log('Is admin:', isAdmin);
  
  if (token) {
    const debugInfo = debugJWTToken(token);
    return {
      hasToken: true,
      tokenInfo: debugInfo,
      userData: userData ? JSON.parse(userData) : null,
      isAdmin: isAdmin === 'true'
    };
  }
  
  return {
    hasToken: false,
    tokenInfo: null,
    userData: null,
    isAdmin: false
  };
};

export const validateTokenForSocket = (token: string) => {
  const debugInfo = debugJWTToken(token);
  
  if (!debugInfo.isValid) {
    return { valid: false, reason: 'Invalid token format' };
  }
  
  if (debugInfo.isExpired) {
    return { valid: false, reason: 'Token expired' };
  }
  
  const payload = debugInfo.payload;
  
  // Check if token has required fields for Socket.IO
  const requiredFields = ['id', 'email'];
  const missingFields = requiredFields.filter(field => !payload[field]);
  
  if (missingFields.length > 0) {
    return { 
      valid: false, 
      reason: `Missing required fields: ${missingFields.join(', ')}` 
    };
  }
  
  return { 
    valid: true, 
    payload: {
      userId: payload.id,
      userRole: payload.role || 'user',
      isAdmin: payload.is_admin || false
    }
  };
};

// Auto-debug on page load (development only)
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    console.log('🔍 Auto-debugging JWT token...');
    checkAuthStatus();
  }, 1000);
} 
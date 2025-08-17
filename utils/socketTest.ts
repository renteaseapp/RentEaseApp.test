// Socket connection testing utility

import { socketService } from '../services/socketService';

export const testSocketConnection = async (token: string) => {
  console.log('🔌 Testing socket connection...');
  
  try {
    // Test connection
    await socketService.connect(token);
    console.log('✅ Socket connected successfully');
    
    // Test event listener
    socketService.on('test_event', (data) => {
      console.log('✅ Test event received:', data);
    });
    
    // Test emit
    socketService.emit('test_emit', { message: 'Hello from client' });
    console.log('✅ Test emit sent');
    
    // Check connection status
    const status = socketService.getConnectionStatus();
    console.log('📊 Connection status:', status);
    
    return { success: true, status };
    
  } catch (error) {
    console.error('❌ Socket connection test failed:', error);
    return { success: false, error };
  }
};

export const monitorSocketEvents = () => {
  console.log('👀 Monitoring socket events...');
  
  // Monitor connection events
  socketService.on('connect', () => {
    console.log('🟢 Socket connected');
  });
  
  socketService.on('disconnect', (reason) => {
    console.log('🔴 Socket disconnected:', reason);
  });
  
  socketService.on('connect_error', (error) => {
    console.log('⚠️ Socket connection error:', error);
  });
  
  // Monitor business events
  socketService.on('product_updated', (product) => {
    console.log('📦 Product updated:', product);
  });
  
  socketService.on('rental_updated', (rental) => {
    console.log('🏠 Rental updated:', rental);
  });
  
  socketService.on('new_notification', (notification) => {
    console.log('🔔 New notification:', notification);
  });
  
  socketService.on('new_message', (message) => {
    console.log('💬 New message:', message);
  });
};

export const getSocketDebugInfo = () => {
  const status = socketService.getConnectionStatus();
  
  return {
    connected: status.connected,
    socketId: status.socketId,
    url: status.url,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    localStorage: {
      hasToken: !!localStorage.getItem('authToken'),
      hasUserData: !!localStorage.getItem('userData'),
      isAdmin: localStorage.getItem('isAdmin') === 'true'
    }
  };
};

// Auto-test on page load (development only)
if (process.env.NODE_ENV === 'development') {
  // Wait for page to load
  setTimeout(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('🧪 Auto-testing socket connection...');
      testSocketConnection(token);
      monitorSocketEvents();
    }
  }, 2000);
} 
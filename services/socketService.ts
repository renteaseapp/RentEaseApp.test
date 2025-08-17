import io, { Socket } from 'socket.io-client';
import { validateTokenForSocket } from '../utils/jwtDebug';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private connectionRetries = 0;
  private maxRetries = 3;
  private pendingListeners: Array<{ event: string; callback: (...args: any[]) => void }> = [];
  private pendingEmits: Array<{ event: string; data?: any }> = [];
  private connectionPromise: Promise<void> | null = null;

  connect(token: string) {
    if (this.socket && this.isConnected) {
      return Promise.resolve(); // Already connected
    }

    if (this.connectionPromise) {
      return this.connectionPromise; // Return existing connection promise
    }

    // Validate token before attempting connection
    const tokenValidation = validateTokenForSocket(token);
    if (!tokenValidation.valid) {
      console.error('❌ Invalid token for socket connection:', tokenValidation.reason);
      return Promise.reject(new Error(`Token validation failed: ${tokenValidation.reason}`));
    }

    console.log('✅ Token validated for socket connection:', tokenValidation.payload);

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Fix for: Property 'env' does not exist on type 'ImportMeta'.
        // Use (import.meta as any).env to bypass TypeScript error.
        const apiUrl =
          (import.meta as any).env?.VITE_API_URL || 'https://renteaseapi-test.onrender.com';

        this.socket = io(apiUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          console.log('Socket.IO connected');
          this.isConnected = true;
          this.connectionRetries = 0;
          
          // Emit user online status
          this.socket?.emit('user_online');
          
          // Process pending listeners
          this.processPendingListeners();
          
          // Process pending emits
          this.processPendingEmits();
          
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
          this.isConnected = false;
          this.connectionPromise = null;
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          this.isConnected = false;
          this.connectionRetries++;
          this.connectionPromise = null;
          
          if (this.connectionRetries < this.maxRetries) {
            console.log(`Retrying connection... (${this.connectionRetries}/${this.maxRetries})`);
          } else {
            console.error('Max connection retries reached');
            reject(error);
          }
        });

        this.socket.on('error', (error) => {
          console.error('Socket.IO error:', error);
          this.connectionPromise = null;
          reject(error);
        });

      } catch (error) {
        console.error('Error creating socket connection:', error);
        this.isConnected = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private processPendingListeners() {
    while (this.pendingListeners.length > 0) {
      const { event, callback } = this.pendingListeners.shift()!;
      this.addListenerInternal(event, callback);
    }
  }

  private processPendingEmits() {
    while (this.pendingEmits.length > 0) {
      const { event, data } = this.pendingEmits.shift()!;
      this.emitInternal(event, data);
    }
  }

  private addListenerInternal(event: string, callback: (...args: any[]) => void) {
    try {
      if (this.socket && this.isConnected) {
        this.socket.on(event, callback);
        
        // Store listener for cleanup
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(callback);
      }
    } catch (error) {
      console.error(`Error adding listener for ${event}:`, error);
    }
  }

  private emitInternal(event: string, data?: any) {
    try {
      if (this.socket && this.isConnected) {
        this.socket.emit(event, data);
      }
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
    }
  }

  disconnect() {
    try {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.connectionPromise = null;
        this.pendingListeners = [];
        this.pendingEmits = [];
      }
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
  }

  // Generic event listener
  on(event: string, callback: (...args: any[]) => void) {
    if (this.isConnected) {
      this.addListenerInternal(event, callback);
    } else {
      // Queue the listener for when connection is established
      this.pendingListeners.push({ event, callback });
      console.log(`Queued listener for ${event}: waiting for connection`);
    }
  }

  // Generic event emitter
  emit(event: string, data?: any) {
    if (this.isConnected) {
      this.emitInternal(event, data);
    } else {
      // Queue the emit for when connection is established
      this.pendingEmits.push({ event, data });
      console.log(`Queued emit for ${event}: waiting for connection`);
    }
  }

  // Chat events
  joinConversation(conversationId: string) {
    this.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.emit('leave_conversation', conversationId);
  }

  sendMessage(message: any) {
    this.emit('send_message', message);
  }

  onNewMessage(callback: (message: any) => void) {
    this.on('new_message', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    this.on('user_typing', callback);
  }

  onMessageReadReceipt(callback: (data: any) => void) {
    this.on('message_read_receipt', callback);
  }

  startTyping(conversationId: string) {
    this.emit('typing_start', conversationId);
  }

  stopTyping(conversationId: string) {
    this.emit('typing_stop', conversationId);
  }

  markMessageAsRead(conversationId: string, messageId: string) {
    this.emit('message_read', { conversationId, messageId });
  }

  // Product events
  joinProduct(productId: string) {
    this.emit('join_product', productId);
  }

  leaveProduct(productId: string) {
    this.emit('leave_product', productId);
  }

  onProductCreated(callback: (product: any) => void) {
    this.on('product_created', callback);
  }

  onProductUpdated(callback: (product: any) => void) {
    this.on('product_updated', callback);
  }

  onProductDeleted(callback: (productId: number) => void) {
    this.on('product_deleted', callback);
  }

  onQuantityUpdated(callback: (quantityData: any) => void) {
    this.on('quantity_updated', callback);
  }

  // Rental events
  joinRental(rentalId: string) {
    this.emit('join_rental', rentalId);
  }

  leaveRental(rentalId: string) {
    this.emit('leave_rental', rentalId);
  }

  onRentalCreated(callback: (rental: any) => void) {
    this.on('rental_created', callback);
  }

  onRentalUpdated(callback: (rental: any) => void) {
    this.on('rental_updated', callback);
  }

  // Review events
  onReviewCreated(callback: (review: any) => void) {
    this.on('review_created', callback);
  }

  onReviewUpdated(callback: (review: any) => void) {
    this.on('review_updated', callback);
  }

  onReviewDeleted(callback: (reviewId: number) => void) {
    this.on('review_deleted', callback);
  }

  // User events
  onUserUpdated(callback: (user: any) => void) {
    this.on('user_updated', callback);
  }

  onUserStatusChanged(callback: (data: any) => void) {
    this.on('user_status_changed', callback);
  }



  // Notification events
  onNewNotification(callback: (notification: any) => void) {
    this.on('new_notification', callback);
  }

  // System events
  onSystemAlert(callback: (alert: any) => void) {
    this.on('system_alert', callback);
  }

  // Chat conversation refresh
  onRefreshConversations(callback: () => void) {
    this.on('refresh_conversations', callback);
  }

  // Remove event listeners
  off(event: string) {
    this.socket?.off(event);
    
    // Clear stored listeners
    this.eventListeners.delete(event);
  }

  // Remove specific callback
  offCallback(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback as any);
    
    // Remove from stored listeners
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Cleanup all listeners
  cleanup() {
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(callback => {
        this.socket?.off(event, callback as any);
      });
    });
    this.eventListeners.clear();
  }
}

export const socketService = new SocketService(); 
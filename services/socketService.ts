import io, { Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string) {
    if (this.socket && this.isConnected) {
      return; // Already connected
    }

    // Fix for: Property 'env' does not exist on type 'ImportMeta'.
    // Use (import.meta as any).env to bypass TypeScript error.
    const apiUrl =
      (import.meta as any).env?.VITE_API_URL || 'https://renteaseapi-test.onrender.com';

    this.socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Rental events
  onRentalCreated(callback: (rental: any) => void) {
    this.socket?.on('rentalCreated', callback);
  }

  onRentalUpdated(callback: (rental: any) => void) {
    this.socket?.on('rentalUpdated', callback);
  }

  // Product events
  onProductUpdated(callback: (product: any) => void) {
    this.socket?.on('productUpdated', callback);
  }

  onProductDeleted(callback: (productId: number) => void) {
    this.socket?.on('productDeleted', callback);
  }

  // Review events
  onReviewCreated(callback: (review: any) => void) {
    this.socket?.on('reviewCreated', callback);
  }

  onReviewUpdated(callback: (review: any) => void) {
    this.socket?.on('reviewUpdated', callback);
  }

  onReviewDeleted(callback: (reviewId: number) => void) {
    this.socket?.on('reviewDeleted', callback);
  }

  // User events
  onUserUpdated(callback: (user: any) => void) {
    this.socket?.on('userUpdated', callback);
  }

  // Claim events
  onClaimCreated(callback: (claim: any) => void) {
    this.socket?.on('claimCreated', callback);
  }

  onClaimUpdated(callback: (claim: any) => void) {
    this.socket?.on('claimUpdated', callback);
  }

  // Remove event listeners
  off(event: string) {
    this.socket?.off(event);
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

export const socketService = new SocketService(); 
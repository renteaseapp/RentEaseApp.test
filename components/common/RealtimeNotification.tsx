import React, { useEffect, useState } from 'react';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  created_at: string;
}

interface RealtimeNotificationProps {
  onNotification?: (notification: Notification) => void;
}

const RealtimeNotification: React.FC<RealtimeNotificationProps> = ({ onNotification }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
      
      // Call parent callback if provided
      if (onNotification) {
        onNotification(notification);
      }

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo/vite.png'
        });
      }
    };

    // Listen for system alerts
    const handleSystemAlert = (alert: any) => {
      console.log('System alert:', alert);
      // You can handle system alerts differently if needed
    };

    // Listen for product updates
    const handleProductUpdate = (product: any) => {
      console.log('Product updated:', product);
      // You can handle product updates if needed
    };

    // Listen for rental updates
    const handleRentalUpdate = (rental: any) => {
      console.log('Rental updated:', rental);
      // You can handle rental updates if needed
    };

    // Listen for quantity updates
    const handleQuantityUpdate = (quantityData: any) => {
      console.log('Quantity updated:', quantityData);
      // You can handle quantity updates if needed
    };

    // Set up event listeners
    socketService.onNewNotification(handleNewNotification);
    socketService.onSystemAlert(handleSystemAlert);
    socketService.onProductUpdated(handleProductUpdate);
    socketService.onRentalUpdated(handleRentalUpdate);
    socketService.onQuantityUpdated(handleQuantityUpdate);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup
    return () => {
      socketService.offCallback('new_notification', handleNewNotification);
      socketService.offCallback('system_alert', handleSystemAlert);
      socketService.offCallback('product_updated', handleProductUpdate);
      socketService.offCallback('rental_updated', handleRentalUpdate);
      socketService.offCallback('quantity_updated', handleQuantityUpdate);
    };
  }, [user, onNotification]);

  // This component doesn't render anything visible
  // It just listens to events and manages notifications
  return null;
};

export default RealtimeNotification; 
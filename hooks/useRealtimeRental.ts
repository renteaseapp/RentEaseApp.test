import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';

interface Rental {
  id: string;
  rental_uid: string;
  product_id: string;
  owner_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  rental_status: string;
  payment_status: string;
  total_amount_due: number;
  calculated_subtotal_rental_fee: number;
  delivery_fee: number;
  platform_fee_renter: number;
  platform_fee_owner: number;
  security_deposit_at_booking: number;
  pickup_method: string;
  return_method: string;
  notes_from_renter?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by_user_id?: string;
  return_condition_status: string;
  actual_return_time?: string;
  late_fee_amount?: number;
  created_at: string;
  updated_at: string;
  // New optional field from backend
  rental_pricing_type_used?: 'daily' | 'weekly' | 'monthly';
  [key: string]: any;
}

interface UseRealtimeRentalProps {
  rentalId: string;
}

export const useRealtimeRental = ({ rentalId }: UseRealtimeRentalProps) => {
  const [rental, setRental] = useState<Rental | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Join rental room when component mounts
  useEffect(() => {
    if (rentalId) {
      socketService.joinRental(rentalId);
      setIsConnected(true);
    }

    return () => {
      if (rentalId) {
        socketService.leaveRental(rentalId);
      }
    };
  }, [rentalId]);

  // Listen for rental updates
  useEffect(() => {
    const handleRentalUpdate = (updatedRental: Rental) => {
      if (updatedRental.id === rentalId || updatedRental.rental_uid === rentalId) {
        setRental(updatedRental);
      }
    };

    const handleRentalCreated = (newRental: Rental) => {
      // This might be useful if you're on a page that shows multiple rentals
      console.log('New rental created:', newRental);
    };

    socketService.onRentalUpdated(handleRentalUpdate);
    socketService.onRentalCreated(handleRentalCreated);

    return () => {
      socketService.offCallback('rental_updated', handleRentalUpdate);
      socketService.offCallback('rental_created', handleRentalCreated);
    };
  }, [rentalId]);

  // Set initial rental data
  const setInitialRental = useCallback((initialRental: Rental) => {
    setRental(initialRental);
  }, []);

  return {
    rental,
    isConnected,
    setInitialRental
  };
};
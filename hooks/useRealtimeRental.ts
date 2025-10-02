import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { Rental } from '../types';

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
      if (updatedRental.id.toString() === rentalId || updatedRental.rental_uid === rentalId) {
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
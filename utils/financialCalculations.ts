import { EstimatedFees } from '../services/settingsService';

/**
 * Utility functions for consistent financial calculations across all pages
 */

export interface RentalCalculationParams {
  rentalPricePerDay: number;
  rentalDays: number;
  securityDeposit?: number;
  pickupMethod?: string;
}

export interface RentalCalculationResult {
  subtotal: number;
  securityDeposit: number;
  estimatedFees: EstimatedFees | null;
  totalAmount: number;
}

/**
 * Calculate rental subtotal
 */
export const calculateRentalSubtotal = (
  rentalPricePerDay: number,
  rentalDays: number
): number => {
  if (!rentalPricePerDay || !rentalDays || rentalDays <= 0) return 0;
  return rentalPricePerDay * rentalDays;
};

/**
 * Calculate total amount with estimated fees
 */
export const calculateTotalAmount = (
  subtotal: number,
  securityDeposit: number = 0,
  estimatedFees: EstimatedFees | null = null
): number => {
  if (estimatedFees) {
    return estimatedFees.total_amount_estimate + securityDeposit;
  }
  return subtotal + securityDeposit;
};

/**
 * Calculate rental costs consistently
 */
export const calculateRentalCosts = (
  params: RentalCalculationParams
): RentalCalculationResult => {
  const { rentalPricePerDay, rentalDays, securityDeposit = 0, pickupMethod = 'self_pickup' } = params;
  
  const subtotal = calculateRentalSubtotal(rentalPricePerDay, rentalDays);
  
  return {
    subtotal,
    securityDeposit,
    estimatedFees: null, // Will be populated by API call
    totalAmount: calculateTotalAmount(subtotal, securityDeposit)
  };
};

/**
 * Format currency consistently
 */
export const formatCurrency = (amount: number): string => {
  if (!amount || isNaN(amount)) return '฿0';
  return `฿${amount.toLocaleString()}`;
};

/**
 * Validate financial amounts
 */
export const validateFinancialAmount = (amount: number): boolean => {
  return amount >= 0 && amount <= 999999999 && !isNaN(amount);
};

/**
 * Calculate percentage-based fees
 */
export const calculatePercentageFee = (baseAmount: number, percentage: number): number => {
  if (!baseAmount || !percentage || percentage < 0) return 0;
  return (baseAmount * percentage) / 100;
};

/**
 * Round to 2 decimal places for financial calculations
 */
export const roundToTwoDecimals = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Compare two amounts with tolerance (for payment verification)
 */
export const compareAmounts = (
  amount1: number,
  amount2: number,
  tolerance: number = 5
): boolean => {
  return Math.abs(amount1 - amount2) <= tolerance;
};

/**
 * Get default values for financial calculations
 */
export const getDefaultFinancialValues = () => ({
  minAmount: 0,
  maxAmount: 999999999,
  defaultSecurityDeposit: 0,
  defaultPlatformFeePercentage: 0,
  defaultDeliveryFee: 0
});

/**
 * Calculate estimated total with fees
 */
export const calculateEstimatedTotal = (
  subtotal: number,
  securityDeposit: number,
  platformFeePercentage: number,
  deliveryFee: number
): number => {
  const platformFee = calculatePercentageFee(subtotal, platformFeePercentage);
  const totalFees = platformFee + deliveryFee;
  return roundToTwoDecimals(subtotal + securityDeposit + totalFees);
};

/**
 * Extract numeric value from string or number
 */
export const extractNumericValue = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Validate rental duration for financial calculations
 */
export const validateRentalDuration = (
  startDate: string,
  endDate: string,
  minDays: number = 1,
  maxDays?: number
): { isValid: boolean; days: number; error?: string } => {
  if (!startDate || !endDate) {
    return { isValid: false, days: 0, error: 'Start and end dates are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end <= start) {
    return { isValid: false, days: 0, error: 'End date must be after start date' };
  }

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  
  if (days < minDays) {
    return { isValid: false, days, error: `Rental duration must be at least ${minDays} day(s)` };
  }
  
  if (maxDays && days > maxDays) {
    return { isValid: false, days, error: `Rental duration cannot exceed ${maxDays} day(s)` };
  }

  return { isValid: true, days };
};

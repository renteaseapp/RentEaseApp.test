import { EstimatedFees } from '../services/settingsService';

/**
 * Utility functions for consistent financial calculations across all pages
 */

export enum RentalType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface RentalCalculationParams {
  rentalPricePerDay: number;
  rentalPricePerWeek?: number | null;
  rentalPricePerMonth?: number | null;
  rentalDays: number;
  rentalType?: RentalType;
  securityDeposit?: number;
  pickupMethod?: string;
}

export interface RentalCalculationResult {
  subtotal: number;
  securityDeposit: number;
  estimatedFees: EstimatedFees | null;
  totalAmount: number;
  rentalType: RentalType;
  effectiveRate: number;
  savings?: number;
  rentalDays: number;
}

/**
 * Determine optimal rental type based on duration and available rates
 */
export const determineOptimalRentalType = (
  rentalDays: number,
  rentalPricePerDay: number,
  rentalPricePerWeek?: number | null,
  rentalPricePerMonth?: number | null
): { type: RentalType; rate: number; savings: number } => {
  if (rentalDays <= 0) {
    return { type: RentalType.DAILY, rate: rentalPricePerDay, savings: 0 };
  }

  const dailyTotal = rentalPricePerDay * rentalDays;
  let bestOption = { type: RentalType.DAILY, rate: rentalPricePerDay, total: dailyTotal, savings: 0 };

  // Check weekly rate if available and duration >= 7 days
  if (rentalPricePerWeek && rentalDays >= 7) {
    const fullWeeks = Math.floor(rentalDays / 7);
    const remainingDaysAfterWeeks = rentalDays % 7;
    const weeklyTotal = (fullWeeks * rentalPricePerWeek) + (remainingDaysAfterWeeks * rentalPricePerDay);
    
    if (weeklyTotal < bestOption.total) {
      bestOption = {
        type: RentalType.WEEKLY,
        rate: rentalPricePerWeek,
        total: weeklyTotal,
        savings: dailyTotal - weeklyTotal
      };
    }
  }

  // Check monthly rate if available and duration >= 30 days
  if (rentalPricePerMonth && rentalDays >= 30) {
    const fullMonths = Math.floor(rentalDays / 30);
    const remainingDaysAfterMonths = rentalDays % 30;
    let monthlyTotal = fullMonths * rentalPricePerMonth;

    // For remaining days, try to apply weekly rate if applicable, otherwise daily
    if (remainingDaysAfterMonths >= 7 && rentalPricePerWeek) {
      const remainingWeeks = Math.floor(remainingDaysAfterMonths / 7);
      const finalRemainingDays = remainingDaysAfterMonths % 7;
      monthlyTotal += (remainingWeeks * rentalPricePerWeek) + (finalRemainingDays * rentalPricePerDay);
    } else {
      monthlyTotal += remainingDaysAfterMonths * rentalPricePerDay;
    }
    
    if (monthlyTotal < bestOption.total) {
      bestOption = {
        type: RentalType.MONTHLY,
        rate: rentalPricePerMonth,
        total: monthlyTotal,
        savings: dailyTotal - monthlyTotal
      };
    }
  }

  return {
    type: bestOption.type,
    rate: bestOption.rate,
    savings: bestOption.savings
  };
};

/**
 * Calculate rental subtotal based on user-selected quantities (for weeks/months)
 */
export const calculateRentalSubtotalFromQuantity = (
  rentalType: RentalType,
  quantity: number,
  rentalPricePerDay: number,
  rentalPricePerWeek?: number | null,
  rentalPricePerMonth?: number | null
): number => {
  if (!quantity || quantity <= 0) return 0;

  switch (rentalType) {
    case RentalType.WEEKLY:
      if (rentalPricePerWeek) {
        return quantity * rentalPricePerWeek;
      }
      // Fallback to daily rate if weekly price not available
      return quantity * 7 * rentalPricePerDay;
    
    case RentalType.MONTHLY:
      if (rentalPricePerMonth) {
        return quantity * rentalPricePerMonth;
      }
      // Fallback to daily rate if monthly price not available
      return quantity * 30 * rentalPricePerDay;
    
    case RentalType.DAILY:
    default:
      return quantity * rentalPricePerDay;
  }
};

/**
 * Calculate rental subtotal based on rental type
 */
export const calculateRentalSubtotal = (
  rentalPricePerDay: number,
  rentalDays: number,
  rentalType?: RentalType,
  rentalPricePerWeek?: number | null,
  rentalPricePerMonth?: number | null
): number => {
  if (!rentalPricePerDay || !rentalDays || rentalDays <= 0) return 0;

  // If no rental type specified, use optimal calculation
  if (!rentalType) {
    const optimal = determineOptimalRentalType(rentalDays, rentalPricePerDay, rentalPricePerWeek, rentalPricePerMonth);
    rentalType = optimal.type;
  }

  switch (rentalType) {
    case RentalType.WEEKLY:
      if (rentalPricePerWeek) {
        const fullWeeks = Math.floor(rentalDays / 7);
        const remainingDays = rentalDays % 7;
        return (fullWeeks * rentalPricePerWeek) + (remainingDays * rentalPricePerDay);
      }
      break;
    
    case RentalType.MONTHLY:
      if (rentalPricePerMonth) {
        const fullMonths = Math.floor(rentalDays / 30);
        const remainingDays = rentalDays % 30;
        let total = fullMonths * rentalPricePerMonth;
        // For remaining days, try to apply weekly rate if applicable, otherwise daily
        if (remainingDays >= 7 && rentalPricePerWeek) {
          const remainingWeeks = Math.floor(remainingDays / 7);
          const finalRemainingDays = remainingDays % 7;
          total += (remainingWeeks * rentalPricePerWeek) + (finalRemainingDays * rentalPricePerDay);
        } else {
          total += remainingDays * rentalPricePerDay;
        }
        return total;
      }
      break;
    
    default:
      return rentalPricePerDay * rentalDays;
  }

  // Fallback to daily rate
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
 * Calculate rental costs consistently with optimal pricing
 */
export const calculateRentalCosts = (
  params: RentalCalculationParams
): RentalCalculationResult => {
  const { 
    rentalPricePerDay, 
    rentalPricePerWeek, 
    rentalPricePerMonth, 
    rentalDays, 
    rentalType,
    securityDeposit = 0, 
    pickupMethod = 'self_pickup' 
  } = params;
  
  // Determine optimal rental type if not specified
  const optimal = determineOptimalRentalType(
    rentalDays, 
    rentalPricePerDay, 
    rentalPricePerWeek, 
    rentalPricePerMonth
  );
  
  const effectiveRentalType = rentalType || optimal.type;
  const subtotal = calculateRentalSubtotal(
    rentalPricePerDay, 
    rentalDays, 
    effectiveRentalType,
    rentalPricePerWeek, 
    rentalPricePerMonth
  );
  
  return {
    subtotal,
    securityDeposit,
    estimatedFees: null, // Will be populated by API call
    totalAmount: calculateTotalAmount(subtotal, securityDeposit),
    rentalType: effectiveRentalType,
    effectiveRate: optimal.rate,
    savings: optimal.savings,
    rentalDays: rentalDays
  };
};

/**
 * Get rental type display information
 */
export const getRentalTypeInfo = (rentalType: RentalType) => {
  const typeInfo = {
    daily: { label: 'รายวัน', unit: 'วัน', multiplier: 1 },
    weekly: { label: 'รายสัปดาห์', unit: 'สัปดาห์', multiplier: 7 },
    monthly: { label: 'รายเดือน', unit: 'เดือน', multiplier: 30 }
  };
  
  return typeInfo[rentalType] || typeInfo.daily;
};

/**
 * Compare all available rental types and return pricing options
 */
export const compareRentalTypes = (
  rentalDays: number,
  rentalPricePerDay: number,
  rentalPricePerWeek?: number | null,
  rentalPricePerMonth?: number | null
) => {
  const options = [];
  
  // Daily option (always available)
  const dailyTotal = rentalPricePerDay * rentalDays;
  options.push({
    type: RentalType.DAILY,
    total: dailyTotal,
    rate: rentalPricePerDay,
    savings: 0,
    savingsPercentage: 0,
    isOptimal: true // Will be updated below
  });
  
  // Weekly option (if available and duration >= 7 days)
  if (rentalPricePerWeek && rentalDays >= 7) {
    const weeks = Math.ceil(rentalDays / 7);
    const weeklyTotal = weeks * rentalPricePerWeek;
    const weeklySavings = dailyTotal - weeklyTotal;
    
    options.push({
      type: RentalType.WEEKLY,
      total: weeklyTotal,
      rate: rentalPricePerWeek,
      savings: weeklySavings,
      savingsPercentage: calculateSavingsPercentage(dailyTotal, weeklyTotal),
      isOptimal: false
    });
  }
  
  // Monthly option (if available and duration >= 30 days)
  if (rentalPricePerMonth && rentalDays >= 30) {
    const months = Math.ceil(rentalDays / 30);
    const monthlyTotal = months * rentalPricePerMonth;
    const monthlySavings = dailyTotal - monthlyTotal;
    
    options.push({
      type: RentalType.MONTHLY,
      total: monthlyTotal,
      rate: rentalPricePerMonth,
      savings: monthlySavings,
      savingsPercentage: calculateSavingsPercentage(dailyTotal, monthlyTotal),
      isOptimal: false
    });
  }
  
  // Find optimal option
  const optimalOption = options.reduce((best, current) => 
    current.total < best.total ? current : best
  );
  
  // Update optimal flags and recalculate savings percentage for optimal option
  options.forEach(option => {
    option.isOptimal = option.type === optimalOption.type;
  });
  
  return {
    options,
    optimal: optimalOption
  };
};

/**
 * Calculate savings percentage
 */
export const calculateSavingsPercentage = (originalAmount: number, discountedAmount: number): number => {
  if (originalAmount <= 0) return 0;
  return Math.round(((originalAmount - discountedAmount) / originalAmount) * 100);
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

/**
 * Calculate rental subtotal using prices stored at booking time
 * This function ensures accurate calculations even if product prices change after booking
 */
export const calculateRentalSubtotalFromBooking = (
  rental: {
    rental_price_per_day_at_booking: number;
    rental_price_per_week_at_booking?: number | null;
    rental_price_per_month_at_booking?: number | null;
    rental_pricing_type_used: RentalType;
  },
  rentalDays: number
): number => {
  const { 
    rental_price_per_day_at_booking,
    rental_price_per_week_at_booking,
    rental_price_per_month_at_booking,
    rental_pricing_type_used
  } = rental;

  switch (rental_pricing_type_used) {
    case RentalType.WEEKLY:
      if (rental_price_per_week_at_booking && rental_price_per_week_at_booking > 0) {
        const weeks = Math.ceil(rentalDays / 7);
        return weeks * rental_price_per_week_at_booking;
      }
      // Fallback to daily if weekly price is not available
      return rentalDays * rental_price_per_day_at_booking;

    case RentalType.MONTHLY:
      if (rental_price_per_month_at_booking && rental_price_per_month_at_booking > 0) {
        const months = Math.ceil(rentalDays / 30);
        return months * rental_price_per_month_at_booking;
      }
      // Fallback to daily if monthly price is not available
      return rentalDays * rental_price_per_day_at_booking;

    case RentalType.DAILY:
    default:
      return rentalDays * rental_price_per_day_at_booking;
  }
};

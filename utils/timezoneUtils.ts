import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

// Default timezone - can be overridden by user preferences
const DEFAULT_TIMEZONE = 'Asia/Bangkok';

export interface TimezoneConfig {
  timezone: string;
  locale: string;
}

/**
 * Get user's timezone from browser or use default
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch (error) {
    console.warn('Could not detect user timezone, using default:', DEFAULT_TIMEZONE);
    return DEFAULT_TIMEZONE;
  }
};

/**
 * Get timezone configuration from localStorage or use defaults
 */
export const getTimezoneConfig = (): TimezoneConfig => {
  try {
    const stored = localStorage.getItem('timezoneConfig');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Could not parse timezone config from localStorage');
  }
  
  return {
    timezone: getUserTimezone(),
    locale: navigator.language || 'en'
  };
};

/**
 * Save timezone configuration to localStorage
 */
export const setTimezoneConfig = (config: TimezoneConfig): void => {
  try {
    localStorage.setItem('timezoneConfig', JSON.stringify(config));
  } catch (error) {
    console.warn('Could not save timezone config to localStorage');
  }
};

/**
 * Convert UTC date string to user's local timezone
 */
export const utcToLocal = (utcDateString: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  const config = getTimezoneConfig();
  return dayjs(utcDateString).tz(config.timezone);
};

/**
 * Convert local date to UTC for API calls
 */
export const localToUtc = (localDate: dayjs.Dayjs | Date | string): string => {
  const config = getTimezoneConfig();
  return dayjs(localDate).tz(config.timezone).utc().toISOString();
};

/**
 * Format date for display in user's timezone
 */
export const formatDate = (
  date: string | Date | dayjs.Dayjs,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  const config = getTimezoneConfig();
  return utcToLocal(date).format(format);
};

/**
 * Format date for display with locale
 */
export const formatDateLocale = (
  date: string | Date | dayjs.Dayjs,
  format: string = 'llll'
): string => {
  const config = getTimezoneConfig();
  return utcToLocal(date).locale(config.locale).format(format);
};

/**
 * Get current date in user's timezone
 */
export const getCurrentDate = (): dayjs.Dayjs => {
  const config = getTimezoneConfig();
  return dayjs().tz(config.timezone);
};

/**
 * Get current date as ISO string in user's timezone
 */
export const getCurrentDateISO = (): string => {
  return getCurrentDate().toISOString();
};

/**
 * Parse date string and convert to user's timezone
 */
export const parseDate = (dateString: string): dayjs.Dayjs => {
  const config = getTimezoneConfig();
  return dayjs(dateString).tz(config.timezone);
};

/**
 * Check if a date is today in user's timezone
 */
export const isToday = (date: string | Date | dayjs.Dayjs): boolean => {
  const today = getCurrentDate();
  const targetDate = utcToLocal(date);
  return today.isSame(targetDate, 'day');
};

/**
 * Check if a date is in the past in user's timezone
 */
export const isPast = (date: string | Date | dayjs.Dayjs): boolean => {
  const now = getCurrentDate();
  const targetDate = utcToLocal(date);
  return targetDate.isBefore(now);
};

/**
 * Check if a date is in the future in user's timezone
 */
export const isFuture = (date: string | Date | dayjs.Dayjs): boolean => {
  const now = getCurrentDate();
  const targetDate = utcToLocal(date);
  return targetDate.isAfter(now);
};

/**
 * Add days to a date in user's timezone
 */
export const addDays = (date: string | Date | dayjs.Dayjs, days: number): dayjs.Dayjs => {
  const config = getTimezoneConfig();
  return utcToLocal(date).add(days, 'day');
};

/**
 * Subtract days from a date in user's timezone
 */
export const subtractDays = (date: string | Date | dayjs.Dayjs, days: number): dayjs.Dayjs => {
  const config = getTimezoneConfig();
  return utcToLocal(date).subtract(days, 'day');
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (date: string | Date | dayjs.Dayjs): string => {
  const config = getTimezoneConfig();
  return utcToLocal(date).locale(config.locale).fromNow();
};

/**
 * Get timezone offset in minutes
 */
export const getTimezoneOffset = (): number => {
  const config = getTimezoneConfig();
  return dayjs().tz(config.timezone).utcOffset();
};

/**
 * Get timezone name for display
 */
export const getTimezoneName = (): string => {
  const config = getTimezoneConfig();
  return config.timezone.replace('_', ' ');
};

/**
 * Get available timezones (common ones for Thailand and Asia)
 */
export const getAvailableTimezones = (): Array<{ value: string; label: string }> => {
  return [
    { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
    { value: 'Asia/Phnom_Penh', label: 'Phnom Penh (GMT+7)' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (GMT+7)' },
    { value: 'Asia/Vientiane', label: 'Vientiane (GMT+7)' },
    { value: 'Asia/Yangon', label: 'Yangon (GMT+6:30)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
    { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (GMT+8)' },
    { value: 'Asia/Manila', label: 'Manila (GMT+8)' },
    { value: 'Asia/Jakarta', label: 'Jakarta (GMT+7)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'Asia/Seoul', label: 'Seoul (GMT+9)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  ];
};

/**
 * Initialize timezone configuration on app startup
 */
export const initializeTimezone = (): void => {
  const config = getTimezoneConfig();
  
  // Set dayjs locale
  try {
    dayjs.locale(config.locale);
  } catch (error) {
    console.warn('Could not set dayjs locale:', config.locale);
  }
  
  console.log('Timezone initialized:', config.timezone, 'Locale:', config.locale);
};

/**
 * Create a date input value for HTML date inputs (YYYY-MM-DD format)
 */
export const toDateInputValue = (date: string | Date | dayjs.Dayjs): string => {
  return utcToLocal(date).format('YYYY-MM-DD');
};

/**
 * Create a datetime input value for HTML datetime-local inputs
 */
export const toDateTimeInputValue = (date: string | Date | dayjs.Dayjs): string => {
  return utcToLocal(date).format('YYYY-MM-DDTHH:mm');
};

/**
 * Get start of day in user's timezone
 */
export const startOfDay = (date: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  return utcToLocal(date).startOf('day');
};

/**
 * Get end of day in user's timezone
 */
export const endOfDay = (date: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  return utcToLocal(date).endOf('day');
};

/**
 * Get start of month in user's timezone
 */
export const startOfMonth = (date: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  return utcToLocal(date).startOf('month');
};

/**
 * Get end of month in user's timezone
 */
export const endOfMonth = (date: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  return utcToLocal(date).endOf('month');
}; 
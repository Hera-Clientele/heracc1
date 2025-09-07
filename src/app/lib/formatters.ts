/**
 * Utility functions for formatting numbers in a user-friendly way
 */

/**
 * Formats a number with appropriate abbreviations (K, M, B) and commas
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted string
 */
export function formatNumber(value: number, options: {
  decimals?: number;
  compact?: boolean;
  currency?: boolean;
  currencySymbol?: string;
} = {}): string {
  const { decimals = 1, compact = true, currency = false, currencySymbol = '$' } = options;
  
  if (isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }

  // Handle zero
  if (value === 0) {
    return currency ? `${currencySymbol}0` : '0';
  }

  // For compact notation (K, M, B)
  if (compact && Math.abs(value) >= 1000) {
    const absValue = Math.abs(value);
    let divisor: number;
    let suffix: string;
    
    if (absValue >= 1e9) {
      divisor = 1e9;
      suffix = 'B';
    } else if (absValue >= 1e6) {
      divisor = 1e6;
      suffix = 'M';
    } else if (absValue >= 1e3) {
      divisor = 1e3;
      suffix = 'K';
    } else {
      divisor = 1;
      suffix = '';
    }
    
    const formatted = (value / divisor).toFixed(decimals);
    // Remove trailing .0 if decimals is 1
    const cleanFormatted = decimals === 1 && formatted.endsWith('.0') 
      ? formatted.slice(0, -2) 
      : formatted;
    
    return currency 
      ? `${currencySymbol}${cleanFormatted}${suffix}`
      : `${cleanFormatted}${suffix}`;
  }

  // For regular formatting with commas
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return currency ? `${currencySymbol}${formatted}` : formatted;
}

/**
 * Formats a number for display in charts and tooltips
 * @param value - The number to format
 * @returns Formatted string
 */
export function formatChartNumber(value: number): string {
  return formatNumber(value, { compact: true, decimals: 1 });
}

/**
 * Formats a number for display in tables and detailed views
 * @param value - The number to format
 * @returns Formatted string
 */
export function formatTableNumber(value: number): string {
  return formatNumber(value, { compact: false, decimals: 0 });
}

/**
 * Formats a percentage value
 * @param value - The decimal value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  
  const percentage = (value * 100).toFixed(decimals);
  return `${percentage}%`;
}

/**
 * Formats a currency value
 * @param value - The number to format
 * @param currencySymbol - The currency symbol to use
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currencySymbol: string = '$'): string {
  return formatNumber(value, { currency: true, currencySymbol });
}






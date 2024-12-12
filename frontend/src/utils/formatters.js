/**
 * Format a number as currency
 * @param {number} value - The numeric value to format
 * @param {string} [locale='en-IN'] - The locale to use for formatting
 * @param {string} [currency='INR'] - The currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, locale = 'en-IN', currency = 'INR') => {
  if (value == null) return '-';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

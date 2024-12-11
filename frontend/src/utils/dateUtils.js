import { format } from 'date-fns';

export const formatDate = (dateInput, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  try {
    // Handle different input types
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      // Fallback parsing for different date string formats
      date = new Date(dateInput);
    } else if (dateInput === null || dateInput === undefined) {
      return '-';
    } else {
      console.error('Unsupported date input type:', typeof dateInput);
      return '-';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return '-';
    }

    // Format the date
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateInput);
    return '-';
  }
};

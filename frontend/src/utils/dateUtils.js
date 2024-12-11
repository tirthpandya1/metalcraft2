import { format, parseISO } from 'date-fns';

export const formatDate = (dateString, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  try {
    return dateString ? format(parseISO(dateString), formatStr) : '-';
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || '-';
  }
};

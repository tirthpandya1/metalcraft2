export const formatLocalDateTime = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const locale = 'en-IN';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  return date.toLocaleString(locale, mergedOptions);
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  
  if (diffInSeconds < minute) {
    return 'Just now';
  } else if (diffInSeconds < hour) {
    const mins = Math.floor(diffInSeconds / minute);
    return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < day) {
    const hrs = Math.floor(diffInSeconds / hour);
    return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  } else {
    return formatLocalDateTime(dateString, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

export const getCurrentLocalTime = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

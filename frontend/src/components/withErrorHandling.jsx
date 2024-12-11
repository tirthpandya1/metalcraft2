import React from 'react';
import { toast } from 'react-toastify';

const withErrorHandling = (WrappedComponent) => {
  return (props) => {
    try {
      return <WrappedComponent {...props} />;
    } catch (error) {
      console.error('Error in component:', error);
      toast.error(error.message || 'An unexpected error occurred');
      return null;
    }
  };
};

export default withErrorHandling;

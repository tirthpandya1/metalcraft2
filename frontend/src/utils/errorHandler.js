import React from 'react';
import { toast } from 'react-toastify';
import { handleMaterialShortageError } from './errorHandlerUtils';
import { handleWorkOrderStatusTransitionError } from './errorHandlerUtils';
import { handleValidationError } from './errorHandlerUtils';

// Toast configuration for consistent error display
export const toastConfig = {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "dark"
};

// Function to extract most meaningful error message
const extractErrorMessage = (error) => {
    // If it's an error with a predefined message
    if (error.message) return error.message;

    // Check for backend error response
    if (error.response && error.response.data) {
        const errorData = error.response.data;

        // Check for specific field errors
        if (errorData.username) {
            return errorData.username[0] || 'Invalid username';
        }
        if (errorData.email) {
            return errorData.email[0] || 'Invalid email';
        }
        if (errorData.password) {
            return errorData.password[0] || 'Invalid password';
        }

        // Check for detail or message in the response
        if (errorData.detail) return errorData.detail;
        if (errorData.message) return errorData.message;
    }

    // HTTP status code based messages
    if (error.response) {
        const statusMessages = {
            400: 'Bad request. Please check your input.',
            401: 'Unauthorized. Please log in again.',
            403: 'Forbidden. You do not have permission.',
            404: 'Resource not found.',
            500: 'Server error. Please try again later.'
        };

        return statusMessages[error.response.status] || 'An unexpected error occurred';
    }

    // Fallback generic message
    return 'An unexpected error occurred';
};

/**
 * Centralized error handling utility for the application
 * @param {Error} error - The error object to handle
 * @param {Object} [options] - Additional configuration options
 * @param {boolean} [options.silent] - If true, prevents toast notification
 * @param {string} [options.customMessage] - Custom error message to display
 */
export const handleApiError = (error, options = {}) => {
    const { silent = false, customMessage } = options;

    // Prevent multiple error handlings
    if (error.handled) return;
    error.handled = true;

    // Extract the most meaningful error message
    const errorMessage = customMessage || extractErrorMessage(error);

    // Log error for debugging
    console.error('API Error:', error);
    console.error('Extracted Error Message:', errorMessage);
    
    // Prevent toast if silent mode is enabled
    if (silent) return;

    // Display toast notification
    toast.error(errorMessage, toastConfig);

    // Additional specific error handling if needed
    if (error.response?.data) {
        const errorData = error.response.data;
        
        switch (errorData.type || errorData.field_errors?.type) {
            case 'MaterialShortageError':
            case 'MaterialShortageAPIException':
                handleMaterialShortageError(errorData);
                break;
            case 'WorkOrderStatusTransitionError':
                handleWorkOrderStatusTransitionError(errorData);
                break;
            case 'ValidationError':
                handleValidationError(errorData);
                break;
        }
    }
};

// Export a wrapper for error handling that can be used as a HOC or directly
export const withErrorHandling = (WrappedComponent) => {
    return function ErrorHandlingWrapper(props) {
        try {
            return React.createElement(WrappedComponent, props);
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };
};

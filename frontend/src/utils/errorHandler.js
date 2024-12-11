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

// Centralized error logging service
const logErrorToService = async (error) => {
    try {
        const errorPayload = {
            message: error.message,
            stack: error.stack,
            type: error.name,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            user: localStorage.getItem('username') || 'anonymous'
        };

        await fetch('/api/log-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(errorPayload)
        });
    } catch (logError) {
        console.error('Failed to log error', logError);
    }
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

    // Log error for debugging and tracking
    console.error('API Error:', error);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    
    // Temporarily disable error logging service
    // logErrorToService(error);

    // Prevent toast if silent mode is enabled
    if (silent) return;

    // Check if error response comes from our custom backend error handler
    if (error.response?.data) {
        const errorData = error.response.data;
        console.log('Error Response Data:', JSON.stringify(errorData, null, 2));
        
        // Different handling based on error type
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
            default:
                // Generic error handling for non-typed errors
                const errorMessage = customMessage || 
                    errorData.detail || 
                    errorData.message || 
                    'An unexpected error occurred';
                
                toast.error(errorMessage, toastConfig);
        }
    } else if (error.response) {
        // Standard HTTP error responses
        const statusMessages = {
            400: 'Invalid request data',
            401: 'Please log in again',
            403: 'You do not have permission',
            404: 'Resource not found',
            500: 'Server error, please try again',
        };

        const message = customMessage || 
            statusMessages[error.response.status] || 
            `Error: ${error.response.status}`;
        
        toast.error(message, toastConfig);
    } else if (error.request) {
        // Network errors
        toast.error(customMessage || 'Unable to connect to server', toastConfig);
    } else {
        // Generic error
        toast.error(customMessage || 'An error occurred', toastConfig);
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

import { toast } from 'react-toastify';
import { 
    handleMaterialShortageError, 
    handleWorkOrderStatusTransitionError, 
    handleValidationError 
} from './errorHandlerUtils';

/**
 * Centralized error handling utility for the application
 */
export const handleApiError = (error) => {
    // Check if error response comes from our custom backend error handler
    if (error.response && error.response.data && error.response.data.error) {
        const errorData = error.response.data;
        
        // Different handling based on error type
        switch (errorData.type) {
            case 'MaterialShortageError':
                handleMaterialShortageError(errorData);
                break;
            case 'WorkOrderStatusTransitionError':
                handleWorkOrderStatusTransitionError(errorData);
                break;
            case 'ValidationError':
                handleValidationError(errorData);
                break;
            default:
                showGenericErrorToast(errorData);
        }
    } else if (error.response) {
        // Standard HTTP error responses
        switch (error.response.status) {
            case 400:
                toast.error('Bad Request: Invalid data submitted');
                break;
            case 401:
                toast.error('Unauthorized: Please log in again');
                break;
            case 403:
                toast.error('Forbidden: You do not have permission');
                break;
            case 404:
                toast.error('Not Found: The requested resource does not exist');
                break;
            case 500:
                toast.error('Server Error: Something went wrong on our end');
                break;
            default:
                toast.error(`Unexpected error: ${error.response.status}`);
        }
    } else if (error.request) {
        // Network errors or no response received
        toast.error('Network Error: Unable to connect to the server');
    } else {
        // Generic error
        toast.error('An unexpected error occurred');
    }
};

/**
 * Show a generic error toast with available details
 */
const showGenericErrorToast = (errorData) => {
    toast.error(errorData.message || 'An unexpected error occurred');
};

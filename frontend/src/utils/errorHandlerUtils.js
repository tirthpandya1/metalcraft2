import { toast } from 'react-toastify';

/**
 * Handle material shortage errors with detailed information
 */
export const handleMaterialShortageError = (errorData) => {
    const materialDetails = errorData.material_details || [];
    
    // Construct a detailed error message
    const errorMessage = materialDetails.map(material => 
        `${material.material_name}: Required ${material.required_quantity}, Available ${material.available_quantity}`
    ).join('\n');

    toast.error(`Material Shortage: Unable to start work order\n${errorMessage}`, {
        autoClose: false, // Keep toast open
    });
};

/**
 * Handle work order status transition errors
 */
export const handleWorkOrderStatusTransitionError = (errorData) => {
    toast.error(`Invalid Work Order Status Transition: Cannot move from ${errorData.current_status} to ${errorData.target_status}`);
};

/**
 * Handle validation errors with field-specific messages
 */
export const handleValidationError = (errorData) => {
    const fieldErrors = errorData.field_errors || {};
    
    // Display each field error
    Object.entries(fieldErrors).forEach(([field, errors]) => {
        const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
        toast.error(`Validation Error in ${field}: ${errorMessage}`);
    });
};

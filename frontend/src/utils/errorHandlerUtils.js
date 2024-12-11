import { toast } from 'react-toastify';

// Common toast configuration
const toastConfig = {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    pauseOnFocusLoss: false,
    theme: 'dark'
};

// Material shortage toast config - slightly longer display time
const materialShortageConfig = {
    ...toastConfig,
    autoClose: 8000, // 8 seconds for material shortage
    style: {
        maxWidth: '400px'
    }
};

/**
 * Handle material shortage errors with detailed information
 */
export const handleMaterialShortageError = (errorData) => {
    console.log('Material Shortage Error Data:', errorData);
    
    // Handle the new error structure
    const materialDetails = Array.isArray(errorData.field_errors?.material_details) 
        ? errorData.field_errors.material_details 
        : [];
    
    if (materialDetails.length === 0) {
        toast.warning(
            errorData.field_errors?.message || 
            errorData.message || 
            'Unable to create work order: Insufficient materials', 
            materialShortageConfig
        );
        return;
    }
    
    // Create a concise summary message
    const shortages = materialDetails.map(material => {
        const required = Number(material.required_quantity || 0).toFixed(1);
        const available = Number(material.available_quantity || 0).toFixed(1);
        const shortagePercentage = Number(material.shortage_percentage || 0).toFixed(1);
        return `${material.material_name}: Need ${required}, Have ${available} (${shortagePercentage}% shortage)`;
    }).join(' | ');

    toast.warning(
        `Unable to create work order. Material Shortages: ${shortages}`, 
        materialShortageConfig
    );
};

/**
 * Handle work order status transition errors
 */
export const handleWorkOrderStatusTransitionError = (errorData) => {
    const message = errorData.message || 'Invalid work order status transition';
    toast.warning(message, toastConfig);
};

/**
 * Handle validation errors with field-specific messages
 */
export const handleValidationError = (errorData) => {
    const fieldErrors = errorData.field_errors || {};
    
    // Show a single toast with all validation errors
    const errorMessages = Object.entries(fieldErrors)
        .map(([field, errors]) => {
            const errorMsg = Array.isArray(errors) ? errors.join(', ') : errors;
            return `${field}: ${errorMsg}`;
        })
        .join('\\n');

    if (errorMessages) {
        toast.error(`Validation Errors:\\n${errorMessages}`, toastConfig);
    } else {
        toast.error('Invalid data submitted', toastConfig);
    }
};

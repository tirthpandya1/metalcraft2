import logging
from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework.response import Response

# Configure logging
logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for providing more detailed error responses
    """
    # Log the full exception details
    logger.error(
        f"Unhandled Exception: {type(exc).__name__}", 
        exc_info=exc,
        extra={
            'context': context,
            'request': context.get('request', None),
            'view': context.get('view', None)
        }
    )

    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If response is None, create a new response for unhandled exceptions
    if response is None:
        return Response({
            'error': True,
            'message': str(exc),
            'type': type(exc).__name__,
            'details': str(exc.__traceback__) if hasattr(exc, '__traceback__') else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Customize existing error responses
    if isinstance(response.data, dict):
        error_data = {
            'error': True,
            'message': response.data.get('detail', 'An error occurred'),
            'type': type(exc).__name__,
            'status': response.status_code,
        }

        # For validation errors, provide more detailed field-level errors
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            error_data['field_errors'] = response.data

        # Create a new response with our custom error format
        response.data = error_data
        return response

    return response

# Custom exceptions for more specific error handling
class MaterialShortageError(Exception):
    """
    Raised when there are insufficient materials for a work order
    """
    def __init__(self, message, material_details=None):
        super().__init__(message)
        self.material_details = material_details or []

    def __str__(self):
        # Provide a detailed error message
        details = "\n".join([
            f"Material: {mat['material_name']} (ID: {mat['material_id']})\n"
            f"  Required: {mat['required_quantity']}\n"
            f"  Available: {mat['available_quantity']}\n"
            f"  Shortage: {mat['required_quantity'] - mat['available_quantity']} "
            f"({mat['shortage_percentage']:.2f}%)"
            for mat in self.material_details
        ])
        return f"{self.args[0]}\n{details}"

class WorkOrderStatusTransitionError(Exception):
    """
    Raised when an invalid work order status transition is attempted
    """
    def __init__(self, current_status, target_status):
        self.current_status = current_status
        self.target_status = target_status
        message = f"Invalid status transition from {current_status} to {target_status}"
        super().__init__(message)

    def __str__(self):
        return (
            f"Cannot transition work order status from {self.current_status} "
            f"to {self.target_status}. Please check the allowed status transitions."
        )

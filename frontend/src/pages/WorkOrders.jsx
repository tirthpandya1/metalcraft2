import React, { useState, useEffect } from 'react';
import { 
  Chip, 
  MenuItem, 
  TextField, 
  CircularProgress, 
  Select 
} from '@mui/material';
import { toast } from 'react-toastify';
import { workOrderService, productService } from '../services/api';
import { withCrudList } from '../components/CrudListPage';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

// Status transition mapping for display and color
const STATUS_TRANSITION_MAP = {
  'PENDING': [
    { status: 'QUEUED', label: 'Queue', color: 'primary' },
    { status: 'READY', label: 'Mark Ready', color: 'success' },
    { status: 'CANCELLED', label: 'Cancel', color: 'error' }
  ],
  'QUEUED': [
    { status: 'READY', label: 'Mark Ready', color: 'success' },
    { status: 'CANCELLED', label: 'Cancel', color: 'error' }
  ],
  'READY': [
    { status: 'IN_PROGRESS', label: 'Start', color: 'primary' },
    { status: 'CANCELLED', label: 'Cancel', color: 'error' }
  ],
  'IN_PROGRESS': [
    { status: 'PAUSED', label: 'Pause', color: 'warning' },
    { status: 'COMPLETED', label: 'Complete', color: 'success' },
    { status: 'BLOCKED', label: 'Block', color: 'error' },
    { status: 'CANCELLED', label: 'Cancel', color: 'error' }
  ],
  'PAUSED': [
    { status: 'IN_PROGRESS', label: 'Resume', color: 'primary' },
    { status: 'CANCELLED', label: 'Cancel', color: 'error' }
  ],
  'BLOCKED': [
    { status: 'READY', label: 'Unblock', color: 'success' },
    { status: 'CANCELLED', label: 'Cancel', color: 'error' }
  ],
  'COMPLETED': [],
  'CANCELLED': []
};

// Work Order Form Component
const WorkOrderForm = React.memo(({ item, onItemChange }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAll();
        console.log('Products response:', response);
        setProducts(Array.isArray(response) ? response : (response.data || []));
      } catch (error) {
        handleApiError(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Product"
        select
        value={item.product || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          product: e.target.value
        }))}
        required
      >
        {products.map((product) => (
          <MenuItem key={product.id} value={product.id}>
            {product.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Quantity"
        type="number"
        value={item.quantity || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          quantity: e.target.value
        }))}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Status"
        select
        value={item.status || 'PENDING'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          status: e.target.value
        }))}
      >
        {[
          { value: 'PENDING', label: 'Pending' },
          { value: 'QUEUED', label: 'Queued' },
          { value: 'READY', label: 'Ready to Start' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'PAUSED', label: 'Paused' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'CANCELLED', label: 'Cancelled' },
          { value: 'BLOCKED', label: 'Blocked' }
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Priority"
        select
        value={item.priority || 'MEDIUM'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          priority: e.target.value
        }))}
      >
        {[
          { value: 'LOW', label: 'Low Priority' },
          { value: 'MEDIUM', label: 'Medium Priority' },
          { value: 'HIGH', label: 'High Priority' },
          { value: 'CRITICAL', label: 'Critical Priority' }
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Notes"
        multiline
        rows={3}
        value={item.notes || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          notes: e.target.value
        }))}
      />
    </>
  );
});

// Configuration for Work Orders CRUD page
const workOrderConfig = {
  entityName: 'Work Order',
  pageTitle: 'Work Orders',
  defaultSortKey: 'created_at',
  defaultItem: {
    product: null,
    quantity: 1,
    status: 'PENDING',
    priority: 'MEDIUM',
    notes: ''
  },
  dialogFields: [
    {
      key: 'product',
      label: 'Product',
      type: 'select',
      required: true,
      options: [] // Will be populated dynamically
    },
    {
      key: 'quantity',
      label: 'Quantity',
      type: 'number',
      required: true,
      validate: (value) => {
        if (!value || value <= 0) {
          return 'Quantity must be greater than zero';
        }
        return null;
      }
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: false,
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'QUEUED', label: 'Queued' },
        { value: 'READY', label: 'Ready to Start' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'PAUSED', label: 'Paused' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'BLOCKED', label: 'Blocked' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      required: false,
      options: [
        { value: 'LOW', label: 'Low Priority' },
        { value: 'MEDIUM', label: 'Medium Priority' },
        { value: 'HIGH', label: 'High Priority' },
        { value: 'CRITICAL', label: 'Critical Priority' }
      ]
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'text',
      required: false
    }
  ],
  searchFields: [
    'product_name',
    'notes',
    'status',
    'priority'
  ],
  columns: [
    { 
      key: 'product_name', 
      label: 'Product',
      render: (item) => item.product_name || 'No Product'
    },
    { 
      key: 'quantity', 
      label: 'Quantity' 
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (item) => {
        // Get possible transitions for the current status
        const transitions = STATUS_TRANSITION_MAP[item.status] || [];
        
        // Determine chip color based on status
        const getStatusColor = (status) => {
          switch (status) {
            case 'COMPLETED': return 'success';
            case 'IN_PROGRESS': return 'primary';
            case 'BLOCKED': return 'error';
            case 'CANCELLED': return 'default';
            case 'PAUSED': return 'warning';
            default: return 'default';
          }
        };

        // If no transitions are possible, render a static chip
        if (transitions.length === 0) {
          return (
            <Chip 
              label={item.status} 
              color={getStatusColor(item.status)}
              size="small"
            />
          );
        }

        // Render a chip with dropdown for status transitions
        return (
          <Select
            value={item.status}
            size="small"
            renderValue={() => (
              <Chip 
                label={item.status} 
                color={getStatusColor(item.status)}
                size="small"
              />
            )}
            onChange={(e) => {
              const newStatus = e.target.value;
              handleStatusChange(item, newStatus);
            }}
            style={{ minWidth: 120 }}
          >
            {transitions.map(transition => (
              <MenuItem 
                key={transition.status} 
                value={transition.status}
              >
                <Chip 
                  label={transition.label} 
                  color={transition.color} 
                  size="small" 
                />
              </MenuItem>
            ))}
          </Select>
        );
      }
    },
    { 
      key: 'priority', 
      label: 'Priority',
      render: (item) => (
        <Chip 
          label={item.priority} 
          color={
            item.priority === 'CRITICAL' ? 'error' : 
            item.priority === 'HIGH' ? 'warning' : 
            item.priority === 'MEDIUM' ? 'primary' : 
            'default'
          }
          size="small"
        />
      )
    }
  ]
};

const handleStatusChange = (item, newStatus) => {
  console.log('Attempting to change status:', {
    currentItem: item,
    currentStatus: item.status,
    newStatus: newStatus
  });

  // Only update if the status is actually different
  if (item.status !== newStatus) {
    console.log('Status is different, proceeding with update');
    
    // Fetch the full work order details first to ensure all required fields are present
    workOrderService.getById(item.id)
      .then(fullWorkOrder => {
        console.log('Fetched full work order:', fullWorkOrder);

        // Create a payload with full work order details
        const updatePayload = {
          product: fullWorkOrder.product,
          quantity: fullWorkOrder.quantity,
          status: newStatus,
          priority: fullWorkOrder.priority,
          notes: fullWorkOrder.notes || '',
          workstation: fullWorkOrder.workstation,
          assigned_to: fullWorkOrder.assigned_to,
          // Send dependencies as an array of IDs
          dependencies: fullWorkOrder.dependencies ? 
            fullWorkOrder.dependencies.map(dep => dep.id || dep) : 
            [],
          blocking_reason: fullWorkOrder.blocking_reason || null
        };

        console.log('Update payload:', updatePayload);

        // Perform the update
        workOrderService.update(item.id, updatePayload)
          .then(() => {
            console.log('Status update successful');
            // Reload the entire list of work orders
            window.location.reload();
            toast.success(`Work Order ${item.id} status updated to ${newStatus}`);
          })
          .catch((error) => {
            console.error('Status update error:', error);
            // Detailed error handling
            if (error.response && error.response.data) {
              const errorMessage = error.response.data.message || 
                                  error.response.data.error || 
                                  'Failed to update work order status';
              toast.error(errorMessage);
            } else {
              toast.error('Failed to update work order status');
            }
            handleApiError(error);
          });
      })
      .catch(error => {
        console.error('Error fetching work order details:', error);
        handleApiError(error);
      });
  } else {
    console.log('Status is the same, no update needed');
  }
};

// Wrap the form with CRUD functionality and error handling
export default withErrorHandling(
  withCrudList(WorkOrderForm, workOrderService, workOrderConfig)
);

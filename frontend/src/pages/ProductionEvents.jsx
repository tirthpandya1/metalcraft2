import React from 'react';
import { Chip, MenuItem, TextField } from '@mui/material';
import { productionEventService, workOrderService } from '../services/api';
import { withCrudList } from '../components/CrudListPage';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

// Production Event Form Component
function ProductionEventForm({ item, onItemChange, workOrders }) {
  return (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Work Order"
        select
        value={item.work_order?.id || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          work_order: workOrders.find(wo => wo.id === e.target.value)
        }))}
        required
      >
        {workOrders.map((workOrder) => (
          <MenuItem key={workOrder.id} value={workOrder.id}>
            {`${workOrder.product_name} - ${workOrder.quantity} units`}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Event Type"
        select
        value={item.event_type || 'START'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          event_type: e.target.value
        }))}
        required
      >
        {[
          { value: 'START', label: 'Production Start' },
          { value: 'PAUSE', label: 'Production Pause' },
          { value: 'RESUME', label: 'Production Resume' },
          { value: 'COMPLETE', label: 'Production Complete' },
          { value: 'QUALITY_CHECK', label: 'Quality Check' },
          { value: 'MATERIAL_SHORTAGE', label: 'Material Shortage' }
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
}

// Configuration for Production Events CRUD page
const productionEventConfig = {
  entityName: 'Production Event',
  pageTitle: 'Production Events',
  defaultSortKey: 'created_at',
  defaultItem: {
    work_order: null,
    event_type: 'START',
    notes: ''
  },
  searchFields: [
    'work_order_product_name',
    'event_type',
    'notes'
  ],
  dialogFields: [
    { 
      key: 'work_order', 
      label: 'Work Order',
      type: 'select',
      options: [] // This will be populated dynamically
    },
    { 
      key: 'event_type', 
      label: 'Event Type',
      type: 'select',
      options: [
        { value: 'START', label: 'Production Start' },
        { value: 'PAUSE', label: 'Production Pause' },
        { value: 'RESUME', label: 'Production Resume' },
        { value: 'COMPLETE', label: 'Production Complete' },
        { value: 'QUALITY_CHECK', label: 'Quality Check' },
        { value: 'MATERIAL_SHORTAGE', label: 'Material Shortage' }
      ]
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'text',
      multiline: true
    }
  ],
  columns: [
    { 
      key: 'work_order_product_name', 
      label: 'Work Order' 
    },
    { 
      key: 'event_type', 
      label: 'Event Type',
      render: (item) => (
        <Chip 
          label={item.event_type} 
          color={
            item.event_type === 'COMPLETE' ? 'success' : 
            item.event_type === 'START' ? 'primary' : 
            item.event_type === 'MATERIAL_SHORTAGE' ? 'error' : 
            'default'
          }
          size="small"
        />
      )
    },
    { 
      key: 'created_at', 
      label: 'Timestamp' 
    }
  ]
};

// Export Production Events page with CrudListPage HOC and Error Handling
export default withErrorHandling(
  withCrudList(
    ProductionEventForm, 
    productionEventService, 
    productionEventConfig
  )
);

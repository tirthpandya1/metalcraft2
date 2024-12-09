import React, { useState, useEffect } from 'react';
import { Chip, MenuItem, TextField } from '@mui/material';
import { workOrderService, productService } from '../services/api';
import { withCrudList } from '../components/CrudListPage';

// Work Order Form Component
function WorkOrderForm({ item, onItemChange, products }) {
  return (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Product"
        select
        value={item.product?.id || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          product: products.find(p => p.id === e.target.value)
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
}

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
  searchFields: [
    'product_name',  // Explicitly search product name
    'notes',         // Search notes
    'status',        // Search by status
    'priority'       // Search by priority
  ],
  dialogFields: [
    { 
      key: 'product', 
      label: 'Product',
      type: 'select',
      options: [] // This will be populated dynamically
    },
    { 
      key: 'quantity', 
      label: 'Quantity',
      type: 'number'
    },
    { 
      key: 'status', 
      label: 'Status',
      type: 'select',
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
      multiline: true
    }
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
      render: (item) => (
        <Chip 
          label={item.status} 
          color={
            item.status === 'COMPLETED' ? 'success' : 
            item.status === 'IN_PROGRESS' ? 'primary' : 
            item.status === 'BLOCKED' ? 'error' : 
            'default'
          }
          size="small"
        />
      )
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

// Export Work Orders page with CrudListPage HOC
export default withCrudList(
  WorkOrderForm, 
  workOrderService, 
  workOrderConfig
);

import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip, 
  MenuItem, 
  TextField
} from '@mui/material';
import { productionDesignService, productService } from '../services/api';
import { withCrudList } from '../components/CrudListPage';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

// Production Design Form Component
function ProductionDesignForm({ item, onItemChange, products }) {
  return (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Name"
        value={item.name || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          name: e.target.value
        }))}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Description"
        multiline
        rows={3}
        value={item.description || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          description: e.target.value
        }))}
      />
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
        label="Status"
        select
        value={item.status || 'DRAFT'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          status: e.target.value
        }))}
      >
        {[
          { value: 'DRAFT', label: 'Draft' },
          { value: 'REVIEW', label: 'Under Review' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' }
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
}

// Configuration for Production Designs CRUD page
const productionDesignConfig = {
  entityName: 'Production Design',
  pageTitle: 'Production Designs',
  defaultSortKey: 'created_at',
  defaultItem: {
    name: '',
    description: '',
    product: null,
    status: 'DRAFT'
  },
  searchFields: [
    'name',
    'description',
    'product_name'
  ],
  dialogFields: [
    { 
      key: 'name', 
      label: 'Name',
      type: 'text'
    },
    { 
      key: 'description', 
      label: 'Description',
      type: 'text',
      multiline: true
    },
    { 
      key: 'product', 
      label: 'Product',
      type: 'select',
      options: [] // This will be populated dynamically
    },
    { 
      key: 'status', 
      label: 'Status',
      type: 'select',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'REVIEW', label: 'Under Review' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' }
      ]
    }
  ],
  columns: [
    { 
      key: 'name', 
      label: 'Name' 
    },
    { 
      key: 'product_name', 
      label: 'Product' 
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (item) => (
        <Chip 
          label={item.status} 
          color={
            item.status === 'APPROVED' ? 'success' : 
            item.status === 'REVIEW' ? 'warning' : 
            item.status === 'REJECTED' ? 'error' : 
            'default'
          }
          size="small"
        />
      )
    }
  ]
};

// Export Production Designs page with CrudListPage HOC and Error Handling
export default withErrorHandling(
  withCrudList(
    ProductionDesignForm, 
    productionDesignService, 
    productionDesignConfig
  )
);

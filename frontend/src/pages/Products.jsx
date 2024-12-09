import React from 'react';
import { 
  TableCell, 
  TableRow, 
  Chip,
  IconButton,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Build as BuildIcon 
} from '@mui/icons-material';
import { withCrudList } from '../components/CrudListPage';
import { productService } from '../services/api';

// Row component for Products
function ProductRow({ item, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'prototype':
        return 'warning';
      case 'discontinued':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableRow>
      <TableCell>{item.name}</TableCell>
      <TableCell>
        <Chip
          label={item.status}
          color={getStatusColor(item.status)}
          size="small"
        />
      </TableCell>
      <TableCell>{item.category}</TableCell>
      <TableCell>{item.price}</TableCell>
      <TableCell>{item.manufacturingTime}</TableCell>
      <TableCell>
        <IconButton size="small" onClick={onEdit}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

// Configuration for Products page
const productsConfig = {
  entityName: 'Product',
  pageTitle: 'Products',
  defaultSortKey: 'name',
  addButtonIcon: <BuildIcon />,
  searchFields: ['name', 'category', 'status'],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'manufacturingTime', label: 'Manufacturing Time' },
  ],
  defaultItem: {
    name: '',
    status: 'Active',
    category: '',
    price: '',
    manufacturingTime: ''
  },
  dialogFields: [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', type: 'number' },
    { key: 'manufacturingTime', label: 'Manufacturing Time' },
  ]
};

// Create the Products page using the HOC
export default withCrudList(ProductRow, productService, productsConfig);

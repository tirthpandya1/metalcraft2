import React from 'react';
import { 
  TableCell, 
  TableRow, 
  Chip,
  IconButton
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Build as BuildIcon 
} from '@mui/icons-material';
import { withCrudList } from '../components/CrudListPage';
import { materialService } from '../services/api';

// Row component for Materials
function MaterialRow({ item, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'success';
      case 'low stock':
        return 'warning';
      case 'out of stock':
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
      <TableCell>{item.quantity}</TableCell>
      <TableCell>{item.unit}</TableCell>
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

// Configuration for Materials page
const materialsConfig = {
  entityName: 'Material',
  pageTitle: 'Materials',
  defaultSortKey: 'name',
  addButtonIcon: <BuildIcon />,
  searchFields: ['name', 'category', 'status'],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
  ],
  defaultItem: {
    name: '',
    status: 'Available',
    category: '',
    quantity: '',
    unit: ''
  }
};

// Create the Materials page using the HOC
export default withCrudList(MaterialRow, materialService, materialsConfig);
